import uuid
import boto3
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ocel_mining_tool import settings
from .models import FileMetadata
from rest_framework.permissions import AllowAny

from .utils import discover_oc_petri_net, discover_ocdfg

logger = logging.getLogger(__name__)


class UploadOCELFileView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if 'file' not in request.FILES:
            logger.error("No file found in the request.")
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']

        if not file.name.endswith('.jsonocel'):

            logger.error("Invalid file format. Only .jsonocel files are allowed.")
            return Response({'error': 'Invalid file format. Only .jsonocel files are allowed.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            unique_filename = f"{uuid.uuid4()}_{file.name}"

            username = request.user.username if request.user.is_authenticated else None

            s3_client = boto3.client(
                's3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            s3_path = f"uploads/{username}/{unique_filename}"
            s3_client.upload_fileobj(
                file,
                settings.AWS_STORAGE_BUCKET_NAME,
                s3_path
            )
            file_upload = FileMetadata.objects.create(
                file_path=s3_path,
                file_name=file.name,
                username=username,
            )
            graph_data = discover_ocdfg(file_upload)

            logger.info("Discovered processes successfully.")
            return Response({'graph': graph_data}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




