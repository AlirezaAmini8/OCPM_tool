from django.db import models

from users.models import User


class FileMetadata(models.Model):
    ocel_path = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    username = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    ocdfg_path = models.CharField(max_length=255, null=True, blank=True)
    ocpn_path = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.file_name
