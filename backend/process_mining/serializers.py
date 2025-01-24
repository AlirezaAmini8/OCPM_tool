from rest_framework import serializers

from process_mining.models import FileMetadata


class FileMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FileMetadata
        fields = ('id', 'file_name', 'uploaded_at', 'object_types')