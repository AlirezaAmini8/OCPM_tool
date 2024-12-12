from rest_framework import serializers


class FileMetadataSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
