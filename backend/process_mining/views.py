import os
import tempfile
import uuid
import boto3
import logging

import pm4py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ocel_mining_tool import settings
from .models import FileMetadata
from rest_framework.permissions import AllowAny

from .utils import filter_ocel, readFromS3, discover, discover_ocdfg, discover_oc_petri_net, serialize_in_file, \
    deserialize_file

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

            with tempfile.NamedTemporaryFile(suffix=".jsonocel", delete=False) as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            ocel = pm4py.read_ocel(temp_file_path)
            object_types = pm4py.ocel_get_object_types(ocel)

            ocdfg = discover(ocel, True)
            ocdfg_path = serialize_in_file(ocdfg)

            params = filter_ocel(ocel)
            graph_data = discover_ocdfg(ocdfg, params)

            file_metadata = FileMetadata.objects.create(
                file_path=s3_path,
                file_name=file.name,
                username=username,
                ocdfg_path=ocdfg_path,
            )
            os.remove(temp_file_path)

            logger.info("Discovered processes successfully.")
            return Response({
                'graph': graph_data,
                'file_metadata_id': file_metadata.id,
                'objects': object_types
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApplyFiltersView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        file_metadata_id = data.get('file_metadata_id')
        visualization_type = data.get('visualizationType')
        previous_visualization_type = data.get('previousVisualizationType')
        filters = {
            "activity_percent": data.get('activityPercent', 90),
            "path_percent": data.get('pathPercent', 90),
            "selected_objects": data.get('unselectedObjects'),
            "annotation_type": data.get('annotationType', 'unique_objects'),
            "orientation": 'TB' if data.get('orientation') == 'vertical' else 'LR'
        }

        try:
            file_metadata = FileMetadata.objects.get(id=file_metadata_id)
            temp_file_path = readFromS3(file_metadata.file_name, file_metadata.file_path)
            ocel = pm4py.read_ocel(temp_file_path)

            if visualization_type != previous_visualization_type:
                if visualization_type == 'ocdfg':
                    if file_metadata.ocdfg_path:
                        discovered_graph = deserialize_file(file_metadata.ocdfg_path)
                    else:
                        discovered_graph = discover(ocel, True)
                        ocdfg_path = serialize_in_file(discovered_graph)
                        file_metadata.ocdfg_path = ocdfg_path
                        file_metadata.save()
                else:
                    if file_metadata.ocpn_path:
                        discovered_graph = deserialize_file(file_metadata.ocpn_path)
                    else:
                        discovered_graph = discover(ocel, False)
                        ocpn_path = serialize_in_file(discovered_graph)
                        file_metadata.ocpn_path = ocpn_path
                        file_metadata.save()
            else:
                if visualization_type == 'ocdfg':
                    discovered_graph = deserialize_file(file_metadata.ocdfg_path)
                else:
                    discovered_graph = deserialize_file(file_metadata.ocpn_path)

            parameters = filter_ocel(ocel, filters)
            if visualization_type == 'ocdfg':
                filtered_graph = discover_ocdfg(discovered_graph, parameters)
            else:
                filtered_graph = discover_oc_petri_net(discovered_graph, parameters)

            return Response({
                'graph': filtered_graph,
                'file_metadata_id': file_metadata_id,
                'previousVisualizationType': visualization_type
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error applying filters: {str(e)}")
            return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
