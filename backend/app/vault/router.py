import datetime as dt
import uuid

import boto3
from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Request,
    Response,
    UploadFile,
)
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

import app.auth.auth as auth_service
from app.auth import errors
from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.auth.schemas import UserCredentials
from app.vault import repository, schemas

router = APIRouter(prefix="/vault", tags=["Vault"])

session = boto3.session.Session()
s3 = session.client(service_name="s3", endpoint_url="https://storage.yandexcloud.net")
BUCKET_NAME = "secure-vault"


@router.post("/upload", response_model=schemas.Node)
async def upload_file(
    file: UploadFile,
    meta: str = Form(),
    user: User = Depends(get_auth_user),
):
    file_id = uuid.uuid4()
    s3.upload_fileobj(file.file, BUCKET_NAME, str(file_id))
    node_in = schemas.NodeCreate.model_validate_json(meta)
    node = await repository.create_node(
        node_in=node_in, owner=user, storage_path=str(file_id)
    )
    return node


@router.get("/files", response_model=list[schemas.Node])
async def get_files(user: User = Depends(get_auth_user)):
    nodes = await repository.get_nodes_by_owner_id(user.id)
    return nodes


@router.get("/files/{file_id}", response_model=schemas.Node)
async def get_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_by_id(file_id)
    if not node or node.owner_id != user.id:
        raise HTTPException(status_code=404, detail="File not found")
    return node


@router.get("/files/{file_id}/download")
async def download_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_by_id(file_id)
    if not node or node.owner_id != user.id:
        raise HTTPException(status_code=404, detail="File not found")

    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": node.storage_path},
        ExpiresIn=3600,
    )
    return RedirectResponse(url=url)


@router.patch("/files/{file_id}", response_model=schemas.Node)
async def update_file(
    file_id: uuid.UUID,
    node_in: schemas.NodeUpdate,
    user: User = Depends(get_auth_user),
):
    node = await repository.get_node_by_id(file_id)
    if not node or node.owner_id != user.id:
        raise HTTPException(status_code=404, detail="File not found")

    updated_node = await repository.update_node(file_id, node_in)
    return updated_node


@router.delete("/files/{file_id}", status_code=204)
async def delete_file(file_id: uuid.UUID, user: User = Depends(get_auth_user)):
    node = await repository.get_node_by_id(file_id)
    if not node or node.owner_id != user.id:
        raise HTTPException(status_code=404, detail="File not found")

    s3.delete_object(Bucket=BUCKET_NAME, Key=node.storage_path)
    await repository.delete_node(file_id)
    return Response(status_code=204)
