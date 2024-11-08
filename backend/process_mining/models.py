from django.db import models

class OCELFile(models.Model):
    file = models.FileField(upload_to='ocel_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)