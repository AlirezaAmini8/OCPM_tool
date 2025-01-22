import os
import tempfile
import logging

import pm4py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FileMetadata
from rest_framework.permissions import AllowAny

from .utils import discover, discover_ocdfg, discover_oc_petri_net, serialize_in_file, \
    deserialize_file, filter_ocel_ocdfg, filter_ocel_ocpn

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
            username = request.user.username if request.user.is_authenticated else None

            with tempfile.NamedTemporaryFile(suffix=".jsonocel", delete=False) as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            ocel = pm4py.read_ocel(temp_file_path)
            object_types = pm4py.ocel_get_object_types(ocel)
            ocel_path = serialize_in_file(ocel)

            ocdfg = discover(ocel, True)
            ocdfg_path = serialize_in_file(ocdfg)

            params, _ = filter_ocel_ocdfg(ocel)

            graph_data = discover_ocdfg(ocdfg, params)

            file_metadata = FileMetadata.objects.create(
                ocel_path=ocel_path,
                file_name=file.name,
                username=username,
                ocdfg_path=ocdfg_path
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


class ApplyFilterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        visualization_type = data.get('visualizationType')
        if visualization_type == 'ocdfg':
            return apply_ocdfg_filters_view(request)
        else:
            return apply_ocpn_filters_view(request)


def apply_ocdfg_filters_view(request):
    data = request.data
    file_metadata_id = data.get('file_metadata_id')
    filters = {
        "activity_percent": data.get('activityPercent', 90),
        "path_percent": data.get('pathPercent', 90),
        "selected_objects": data.get('unselectedObjects'),
        "annotation_type": data.get('annotationType', 'unique_objects'),
        "orientation": 'TB' if data.get('orientation') == 'vertical' else 'LR'
    }

    try:
        file_metadata = FileMetadata.objects.get(id=file_metadata_id)
        ocel = deserialize_file(file_metadata.ocel_path)

        if file_metadata.ocdfg_path:
            ocdfg = deserialize_file(file_metadata.ocdfg_path)
        else:
            ocdfg = discover(ocel, True)
            ocdfg_path = serialize_in_file(ocdfg)
            file_metadata.ocdfg_path = ocdfg_path
            file_metadata.save()

        parameters, ocdfg = filter_ocel_ocdfg(ocel, ocdfg, filters)
        filtered_graph = discover_ocdfg(ocdfg, parameters)

        return Response({
            'graph': filtered_graph,
            'file_metadata_id': file_metadata_id,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error applying filters: {str(e)}")
        return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def apply_ocpn_filters_view(request):
    data = request.data
    file_metadata_id = data.get('file_metadata_id')

    filters = {
        "selected_objects": data.get('unselectedObjects'),
        "orientation": 'TB' if data.get('orientation') == 'vertical' else 'LR'
    }

    try:
        file_metadata = FileMetadata.objects.get(id=file_metadata_id)
        ocel = deserialize_file(file_metadata.ocel_path)

        if file_metadata.ocpn_path:
            ocpn = deserialize_file(file_metadata.ocpn_path)
        else:
            ocpn = discover(ocel, False)
            ocpn_path = serialize_in_file(ocpn)
            file_metadata.ocpn_path = ocpn_path
            file_metadata.save()

        parameters, ocpn = filter_ocel_ocpn(ocel, ocpn, filters)
        filtered_graph = discover_oc_petri_net(ocpn, parameters)

        return Response({
            'graph': filtered_graph,
            'file_metadata_id': file_metadata_id,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error applying filters: {str(e)}")
        return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
