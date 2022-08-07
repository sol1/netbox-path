from netbox.filtersets import NetBoxModelFilterSet
from .models import Path


class PathFilterSet(NetBoxModelFilterSet):

    class Meta:
        model = Path
        fields = ('id', 'name', 'description')

    def search(self, queryset, name, value):
        return queryset.filter(description__icontains=value)
