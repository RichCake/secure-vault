import os
import urllib.parse
import uuid

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse

from app.auth import repository as auth_repository
from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.config import settings
from app.vault import repository, schemas
from app.vault.service import S3StorageService

router = APIRouter(prefix="/vault", tags=["Vault"])

storage = S3StorageService(
    bucket_name=settings.S3_BUCKET_NAME,
    endpoint_url=settings.S3_ENDPOINT_URL,
    region_name=settings.S3_REGION,
    access_key_id=settings.S3_ACCESS_KEY,
    secret_access_key=settings.S3_SECRET_KEY,
)


async def _get_file_size(upload: UploadFile) -> int:
    fileobj = upload.file
    current = fileobj.tell()
    fileobj.seek(0, os.SEEK_END)
    size = fileobj.tell()
    fileobj.seek(current, os.SEEK_SET)
    return size


async def _ensure_owner(node_id: uuid.UUID, user: User):
    node = await repository.get_node_by_id(node_id)
    if not node or node.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )
    return node


async def _ensure_parent_access(parent_id: uuid.UUID | None, user: User):
    if parent_id is None:
        return None
    parent = await repository.get_node_by_id(parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent folder not found")
    if not parent.is_folder:
        raise HTTPException(status_code=400, detail="Parent must be a folder")
    if parent.owner_id != user.id:
        raise HTTPException(
            status_code=403, detail="No permission for the parent folder"
        )
    return parent


async def _ensure_no_cycles(node_id: uuid.UUID, new_parent_id: uuid.UUID | None):
    if new_parent_id is None:
        return
    if node_id == new_parent_id:
        raise HTTPException(status_code=400, detail="Cannot move into itself")
    current = await repository.get_node_by_id(new_parent_id)
    while current:
        if current.id == node_id:
            raise HTTPException(
                status_code=400, detail="Cannot move into own descendant"
            )
        if current.parent_id is None:
            break
        current = await repository.get_node_by_id(current.parent_id)


async def _ensure_can_write(node_id: uuid.UUID, user: User):
    """Ensure user is owner or has write permission for the node."""
    node = await repository.get_node_by_id(node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )
    # Owner can always write
    if node.owner_id == user.id:
        return node
    # Check if user has write permission
    permission = await repository.get_user_permission(node_id, user.id)
    if permission != "write":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No write permission for this file",
        )
    return node


@router.post("/upload", response_model=schemas.Node)
async def upload_file(
    file: UploadFile,
    parent_id: uuid.UUID | None = Form(default=None),
    user: User = Depends(get_auth_user),
):
    await _ensure_parent_access(parent_id, user)
    storage_key = str(uuid.uuid4())
    size = await _get_file_size(file)
    await file.seek(0)
    await storage.upload_fileobj(
        file.file,
        storage_key,
        content_type=file.content_type or "application/octet-stream",
    )

    node = await repository.create_node(
        owner=user,
        name=urllib.parse.unquote(file.filename),
        is_folder=False,
        parent_id=parent_id,
        storage_path=storage_key,
        size=size,
        mime_type=file.content_type or "application/octet-stream",
        meta={"original_filename": file.filename},
    )
    return node


@router.post(
    "/folders", response_model=schemas.Node, status_code=status.HTTP_201_CREATED
)
async def create_folder(
    folder_in: schemas.FolderCreate, user: User = Depends(get_auth_user)
):
    await _ensure_parent_access(folder_in.parent_id, user)
    node = await repository.create_node(
        owner=user,
        name=folder_in.name,
        is_folder=True,
        parent_id=folder_in.parent_id,
        storage_path=None,
        size=None,
        mime_type=None,
    )
    return node


@router.get("/files", response_model=list[schemas.Node])
async def get_files(
    parent_id: uuid.UUID | None = Query(default=None),
    shared: bool | None = Query(default=None),
    user: User = Depends(get_auth_user),
):
    return await repository.list_nodes_for_user(
        user.id, parent_id, shared_filter=shared
    )


@router.get("/files/{file_id}", response_model=schemas.Node)
async def get_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_for_user(file_id, user.id)
    if not node:
        raise HTTPException(status_code=404, detail="File not found")
    return node


@router.get("/files/{file_id}/download")
async def download_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_for_user(file_id, user.id)
    if not node or node.is_folder or not node.storage_path:
        raise HTTPException(status_code=404, detail="File not found")
    url = storage.get_presigned_url(node.storage_path)
    return RedirectResponse(url=url)


@router.get("/search", response_model=list[schemas.Node])
async def search_nodes(
    q: str = Query(min_length=1), user: User = Depends(get_auth_user)
):
    return await repository.search_nodes(user.id, q)


@router.patch("/files/{file_id}", response_model=schemas.Node)
async def update_file(
    file_id: uuid.UUID,
    node_in: schemas.NodeUpdate,
    user: User = Depends(get_auth_user),
):
    node = await _ensure_can_write(file_id, user)
    # Only owner can move files to another folder
    if node_in.parent_id is not None and node.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can move files",
        )
    await _ensure_parent_access(node_in.parent_id, user)
    await _ensure_no_cycles(node.id, node_in.parent_id)
    updated_node = await repository.update_node(file_id, node_in)
    return updated_node


@router.put("/files/{file_id}/content", response_model=schemas.Node)
async def update_file_content(
    file_id: uuid.UUID,
    file: UploadFile,
    user: User = Depends(get_auth_user),
):
    node = await _ensure_can_write(file_id, user)
    if node.is_folder:
        raise HTTPException(status_code=400, detail="Cannot upload content to a folder")
    if not node.storage_path:
        raise HTTPException(status_code=400, detail="File has no storage path")

    size = await _get_file_size(file)
    await file.seek(0)
    await storage.upload_fileobj(
        file.file,
        node.storage_path,
        content_type=file.content_type or "application/octet-stream",
    )

    updated_node = await repository.update_node_content(
        file_id,
        size=size,
        mime_type=file.content_type or "application/octet-stream",
        original_filename=file.filename,
    )
    return updated_node


@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await _ensure_owner(file_id, user)
    if node.storage_path:
        await storage.delete_object(node.storage_path)
    await repository.delete_node(file_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/files/{file_id}/share",
    response_model=schemas.ShareEntry,
    status_code=status.HTTP_201_CREATED,
)
async def share_file(
    file_id: uuid.UUID,
    share_in: schemas.ShareRequest,
    user: User = Depends(get_auth_user),
):
    node = await _ensure_owner(file_id, user)
    target_user = await auth_repository.get_user(share_in.target_username)
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    access = await repository.grant_access(node, target_user, share_in.permission)
    return schemas.ShareEntry(
        user_id=target_user.id,
        username=target_user.username,
        permission=access.permission,
    )


@router.get(
    "/files/{file_id}/access",
    response_model=list[schemas.ShareEntry],
)
async def list_access(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_by_id(file_id)
    entries = await repository.list_access_entries(node.id)
    return [
        schemas.ShareEntry(
            user_id=entry.user_id,
            username=entry.user.username if entry.user else "",
            permission=entry.permission,
        )
        for entry in entries
    ]


@router.patch(
    "/files/{file_id}/share/{target_user_id}",
    response_model=schemas.ShareEntry,
)
async def update_share(
    file_id: uuid.UUID,
    target_user_id: uuid.UUID,
    share_in: schemas.ShareUpdate,
    user: User = Depends(get_auth_user),
):
    """Update permission for an existing share."""
    await _ensure_owner(file_id, user)
    access = await repository.update_access_permission(
        file_id, target_user_id, share_in.permission
    )
    if not access:
        raise HTTPException(status_code=404, detail="Share not found")
    return schemas.ShareEntry(
        user_id=access.user_id,
        username=access.user.username if access.user else "",
        permission=access.permission,
    )


@router.delete(
    "/files/{file_id}/share/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def revoke_share(
    file_id: uuid.UUID,
    target_user_id: uuid.UUID,
    user: User = Depends(get_auth_user),
):
    await _ensure_owner(file_id, user)
    removed = await repository.revoke_access(file_id, target_user_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Share not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
