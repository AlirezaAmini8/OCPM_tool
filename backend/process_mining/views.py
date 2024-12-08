import networkx as nx
import pm4py
import os

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from tempfile import NamedTemporaryFile
from .models import FileMetadata, Process


class UploadOCELFileView(APIView):

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']

        if not file.name.endswith('.jsonocel'):
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
                for event in ocel_log.events:
                    process_id = event['case:concept:name']
                    if process_id not in processes_dict:
                        processes_dict[process_id] = {
                            'activities': set(),
                            'objects': set()
                        }
                    processes_dict[process_id]['activities'].add(event['concept:name'])
                    if 'concept:object' in event:
                        processes_dict[process_id]['objects'].add(event['concept:object'])

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

                os.remove(tmp_path)

                G = nx.DiGraph()
                for process_id, process_data in processes_dict.items():
                    for activity in process_data['activities']:
                        for obj in process_data['objects']:
                            G.add_edge(activity, obj, process=process_id)

                graph_data = {
                    "nodes": [{"id": node} for node in G.nodes],
                    "edges": [{"source": u, "target": v, "process": G[u][v].get('process')} for u, v in G.edges]
                }

                return Response({
                    'file_name': file.name,
                    'graph': graph_data
                }, status=status.HTTP_200_OK)

            except Exception as e:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                return Response({'error': f'Error processing OCEL file: {str(e)}'},
                                status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

