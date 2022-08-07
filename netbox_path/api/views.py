from django.db.models import Count

from netbox.api.viewsets import NetBoxModelViewSet

from .. import filtersets, models
from .serializers import PathSerializer


class PathViewSet(NetBoxModelViewSet):
    queryset = models.Path.objects.prefetch_related('tags')
    serializer_class = PathSerializer
