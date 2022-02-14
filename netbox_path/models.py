from pyexpat import model
from statistics import mode
from django.db import models

class Path(models.Model):
    name = models.CharField(
        max_length=100
    )

    description = models.CharField(
        max_length=200,
        blank=True
    )

    class Meta:
        verbose_name_plural = 'Paths'
        unique_together = ['name', 'description']

    def __str__(self):
        return self.name