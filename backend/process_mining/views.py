import uuid
import boto3
import pm4py
import os
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ocel_mining_tool import settings
from .models import FileMetadata
import traceback
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


class UploadOCELFileView(APIView):
    permission_classes = [AllowAny]

    # def post(self, request):
    #     if 'file' not in request.FILES:
    #         logger.error("No file found in the request.")
    #         return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
    #
    #     file = request.FILES['file']
    #
    #     if not file.name.endswith('.jsonocel'):
    #         logger.error("Invalid file format. Only .jsonocel files are allowed.")
    #         return Response({'error': 'Invalid file format. Only .jsonocel files are allowed.'},
    #                         status=status.HTTP_400_BAD_REQUEST)
    #
    #     try:
    #         unique_filename = f"{uuid.uuid4()}_{file.name}"
    #
    #         username = request.user.username if request.user.is_authenticated else None
    #         try:
    #             s3_client = boto3.client(
    #                 's3',
    #                 aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    #                 aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    #             )
    #             s3_path = f"uploads/{username}/{unique_filename}"
    #             s3_client.upload_fileobj(
    #                 file,
    #                 settings.AWS_STORAGE_BUCKET_NAME,
    #                 s3_path
    #             )
    #             file_upload = FileMetadata.objects.create(
    #                 file_path=s3_path,
    #                 filename=file.name,
    #                 username=username,
    #             )
