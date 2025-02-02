import os
import tempfile
import logging
from rest_framework.authtoken.models import Token


import pm4py
from rest_framework import status
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FileMetadata
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import FileMetadataSerializer
from .utils import discover, discover_ocdfg, discover_oc_petri_net, serialize_in_file, \
    deserialize_file, filter_ocel_ocdfg, filter_ocel_ocpn

logger = logging.getLogger(__name__)


class UploadOCELFileView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = [TokenAuthentication, SessionAuthentication]

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
            token_key = request.META.get('HTTP_AUTHORIZATION', '').split('Token ')[-1]
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
            except Token.DoesNotExist:
                user = None

            user = user or (request.user if request.user.is_authenticated else None)

            with tempfile.NamedTemporaryFile(suffix=".jsonocel", delete=False) as temp_file:
                for chunk in file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            ocel = None
            try:
                ocel = pm4py.read_ocel(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to read OCEL with pm4py.read_ocel: {str(e)}. Trying pm4py.read_ocel2.")
                try:
                    ocel = pm4py.read_ocel2(temp_file_path)
                except Exception as e:
                    logger.error(f"Failed to read OCEL with pm4py.read_ocel2: {str(e)}")
                    raise ValueError("Unable to read the provided JSON-OCEL file.")

            object_types = pm4py.ocel_get_object_types(ocel)
            ocel_path = serialize_in_file(ocel)

            ocdfg = discover(ocel, True)
            ocdfg_path = serialize_in_file(ocdfg)

            params, ocdfg = filter_ocel_ocdfg(ocel, ocdfg)

            graph_data = discover_ocdfg(ocdfg, params)

            file_metadata = FileMetadata.objects.create(
                ocel_path=ocel_path,
                file_name=file.name,
                username=user,
                ocdfg_path=ocdfg_path,
                object_types=object_types
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
        "orientation": 'TB' if data.get('orientation') == 'vertical' else 'LR',
        "format": data.get('format', 'svg')
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
        "orientation": 'TB' if data.get('orientation') == 'vertical' else 'LR',
        "format": data.get('format', 'svg')
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


class UserFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        files = FileMetadata.objects.filter(username=request.user)
        serializer = FileMetadataSerializer(files, many=True)
        return Response(serializer.data)


class RetrieveFileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        try:
            file_metadata = FileMetadata.objects.get(id=file_id, username=request.user)
        except FileMetadata.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            ocdfg = deserialize_file(file_metadata.ocdfg_path)
            filters = {
                "activity_percent": 10,
                "path_percent": 10,
                "selected_objects": None,
                "annotation_type": "unique_objects",
                "orientation": "LR"
            }
            parameters, _ = filter_ocel_ocdfg(None, ocdfg, filters=filters)
            graph_data = discover_ocdfg(ocdfg, parameters)
            return Response({
                'graph': graph_data,
                'objects': file_metadata.object_types,
                'file_metadata_id': file_metadata.id
            })
        except Exception as e:
            logger.error(f"Error retrieving file: {str(e)}")
            return Response({'error': 'Error processing the file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, file_id):
        try:
            file_metadata = FileMetadata.objects.get(id=file_id, username=request.user)

            for path_field in [file_metadata.ocel_path,
                               file_metadata.ocdfg_path,
                               file_metadata.ocpn_path]:
                if path_field and os.path.exists(path_field):
                    try:
                        os.remove(path_field)
                    except Exception as e:
                        logger.error(f"Error deleting file {path_field}: {e}")

            file_metadata.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        except FileMetadata.DoesNotExist:
            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
            return Response({'error': 'Error deleting file'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)