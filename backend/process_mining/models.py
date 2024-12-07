from django.db import models


class FileMetadata(models.Model):
    file_name = models.CharField(max_length=255)
    filters = models.JSONField()
    processes = models.ManyToManyField('Process', related_name='file_metadata')

    def __str__(self):
        return self.file_name


class Process(models.Model):
    process_id = models.CharField(max_length=255)
    activities = models.JSONField()
    objects_involved = models.JSONField()

    def __str__(self):
        return self.process_id
