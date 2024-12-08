import pm4py
import os
import logging
from tempfile import NamedTemporaryFile
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import FileMetadata, Process
import traceback

logger = logging.getLogger(__name__)


class UploadOCELFileView(APIView):

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
            with NamedTemporaryFile(delete=False, suffix='.jsonocel') as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_path = tmp_file.name

            try:
                ocel_log = pm4py.read_ocel(tmp_path)

                processes_dict = {}
                for event in ocel_log.events.itertuples():
                    process_id = getattr(event, 'case:concept:name', None)
                    if process_id:
                        if process_id not in processes_dict:
                            processes_dict[process_id] = {'activities': set(), 'objects': set()}
                        processes_dict[process_id]['activities'].add(getattr(event, 'concept:name', ''))
                        if hasattr(event, 'concept:object'):
                            processes_dict[process_id]['objects'].add(getattr(event, 'concept:object', ''))
                    else:
                        logger.warning(f"Event missing process ID: {event}")

                file_metadata = FileMetadata.objects.create(
                    file_name=file.name,
                    filters={}
                )
                process_objs = []
                for process_id, process_data in processes_dict.items():
                    process = Process.objects.create(
                        process_id=process_id,
                        activities=list(process_data['activities']),
                        objects_involved=list(process_data['objects'])
                    )
                    process_objs.append(process)

                file_metadata.processes.set(process_objs)

                try:
                    net = pm4py.discover_oc_petri_net(ocel_log)
                    logger.info("OC Petri net discovered successfully.")
                except Exception as e:
                    logger.error(f"Error discovering OC Petri net: {str(e)}")
                    return Response({'error': f'Error discovering OC Petri net: {str(e)}'},
                                    status=status.HTTP_400_BAD_REQUEST)

                graph_data = self.convert_petri_net_to_graph_structure(net)

                os.remove(tmp_path)
                logger.info(f"Temporary file removed: {tmp_path}")

                return Response({'graph': graph_data}, status=status.HTTP_200_OK)

            except Exception as e:
                logger.error(f"Error processing OCEL file: {str(e)}")
                logger.error(f"Exception traceback: {traceback.format_exc()}")

                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                return Response({'error': f'Error processing OCEL file: {str(e)}'},
                                status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error in file handling or reading: {str(e)}")
            logger.error(f"Exception traceback: {traceback.format_exc()}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def convert_petri_net_to_graph_structure(self, net):
        places, transitions, arcs = net

        nodes = []
        edges = []

        for place in places:
            nodes.append({'id': str(place), 'label': f"Place {place}"})

        for transition in transitions:
            nodes.append({'id': str(transition), 'label': f"Transition {transition}"})

        for arc in arcs:
            source, target = arc
            edges.append({'from': str(source), 'to': str(target)})

        return {'nodes': nodes, 'edges': edges}
