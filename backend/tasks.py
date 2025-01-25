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
            for path_field in [file_record.ocel_path,
                               file_record.ocdfg_path,
                               file_record.ocpn_path]:
                if path_field and os.path.exists(path_field):
                    os.remove(path_field)
            file_record.delete()

        except Exception as e:
            print(f"Error deleting file {file_record.file_name}: {e}")
