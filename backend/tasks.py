from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import boto3
from django.conf import settings
from process_mining.models import FileMetadata


@shared_task
def delete_temporary_uploads():
    cutoff_time = timezone.now() - timedelta(hours=24)

    temporary_files = FileMetadata.objects.filter(
        username__isnull=True,
        uploaded_at__lt=cutoff_time
    )

    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

    for file_record in temporary_files:
        try:
            s3_client.delete_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=file_record.file_path
            )

            file_record.delete()

        except Exception as e:
            print(f"Error deleting file {file_record.file_path}: {e}")