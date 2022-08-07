from django.db import models
from netbox.models import NetBoxModel

class Path(models.Model):
    name = models.CharField(
        max_length=64
    )
    description = models.CharField(
        max_length=255,
        blank=True
    )
    data = models.JSONField(
        blank=True
    )

    class Meta:
        verbose_name_plural = 'Paths'

    def __str__(self):
        return self.name