from django.db import models
from django.urls import reverse

from netbox.models import NetBoxModel

class Path(NetBoxModel):
    name = models.CharField(
        max_length=64
    )
    description = models.TextField(
        blank=True
    )
    graph = models.JSONField(
        blank=True,
        null=True
    )

    def get_absolute_url(self):
        return reverse('plugins:netbox_path:path', args=[self.pk])

    def __str__(self):
        return self.name