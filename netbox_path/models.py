from django.db import models
from django.urls import reverse
from utilities.querysets import RestrictedQuerySet

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

    objects = RestrictedQuerySet.as_manager()

    def get_absolute_url(self):
        return reverse('plugins:netbox_path:path', args=[self.pk])

    class Meta:
        verbose_name_plural = 'Paths'

    def __str__(self):
        return self.name