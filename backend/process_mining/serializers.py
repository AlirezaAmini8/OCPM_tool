from rest_framework import serializers
from .models import OCELFile

class OCELFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OCELFile
        fields = ['file']