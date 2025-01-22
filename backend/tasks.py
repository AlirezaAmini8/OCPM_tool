import os

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

    for file_record in temporary_files:
        try:
            os.remove(file_record.ocdfg_path)
            os.remove(file_record.ocpn_path)
            os.remove(file_record.ocel_path)
            file_record.delete()

        except Exception as e:
            print(f"Error deleting file {file_record.file_name}: {e}")