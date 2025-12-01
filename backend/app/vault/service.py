from __future__ import annotations

import asyncio
from typing import IO, Any

import boto3


class S3StorageService:
    def __init__(
        self,
        bucket_name: str,
        *,
        endpoint_url: str | None = None,
        region_name: str | None = None,
        access_key_id: str | None = None,
        secret_access_key: str | None = None,
    ) -> None:
        self.bucket_name = bucket_name
        session = boto3.session.Session(
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region_name,
        )
        self._client = session.client("s3", endpoint_url=endpoint_url)

    async def upload_fileobj(
        self,
        file_obj: IO[bytes],
        key: str,
        *,
        content_type: str | None = None,
        extra_args: dict[str, Any] | None = None,
    ) -> None:
        extra = extra_args or {}
        if content_type:
            extra.setdefault("ContentType", content_type)

        def _upload():
            kwargs: dict[str, Any] = {
                "Fileobj": file_obj,
                "Bucket": self.bucket_name,
                "Key": key,
            }
            if extra:
                kwargs["ExtraArgs"] = extra
            self._client.upload_fileobj(**kwargs)

        await asyncio.to_thread(_upload)

    async def delete_object(self, key: str) -> None:
        await asyncio.to_thread(
            self._client.delete_object, Bucket=self.bucket_name, Key=key
        )

    def get_presigned_url(self, key: str, *, expires_in: int = 3600) -> str:
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": key},
            ExpiresIn=expires_in,
        )

