from rest_framework import serializers
from .models import FileMetadata, Process


class ProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Process
        fields = ['process_id', 'activities', 'objects_involved']


class FileMetadataSerializer(serializers.ModelSerializer):
    processes = ProcessSerializer(many=True)

    class Meta:
        model = FileMetadata
        fields = ['file_name', 'filters', 'processes']
