import os

from django.db import models

from users.models import User


class FileMetadata(models.Model):
    ocel_path = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    username = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    ocdfg_path = models.CharField(max_length=255, null=True, blank=True)
    ocpn_path = models.CharField(max_length=255, null=True, blank=True)
    object_types = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.file_name

    def delete(self, *args, **kwargs):
        for path_field in [self.ocel_path, self.ocdfg_path, self.ocpn_path]:
            if path_field and os.path.isfile(path_field):
                try:
                    os.remove(path_field)
                except Exception as e:
                    print(f"Error deleting file {path_field}: {e}")

        super().delete(*args, **kwargs)
