from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.notifications import repository, schemas

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", response_model=schemas.NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_in: schemas.NotificationCreate,
    user: User = Depends(get_auth_user),
):
    notification = await repository.create_notification(
        user_id=notification_in.user_id,
        type=notification_in.type,
        payload=notification_in.payload,
    )
    return notification


@router.get("", response_model=list[schemas.NotificationOut])
async def get_notifications(user: User = Depends(get_auth_user)):
    notifications = await repository.get_notifications_for_user(user.id)
    return notifications


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: UUID,
    user: User = Depends(get_auth_user),
):
    notification = await repository.get_notification_by_id(notification_id)
    if not notification or notification.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    await repository.delete_notification(notification_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_notifications(user: User = Depends(get_auth_user)):
    await repository.delete_all_notifications_for_user(user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

