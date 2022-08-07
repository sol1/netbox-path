from rest_framework import serializers

from ipam.api.serializers import NestedPrefixSerializer
from netbox.api.serializers import NetBoxModelSerializer, WritableNestedSerializer
from ..models import Path

class PathSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name='plugins-api:netbox_path-api:path-detail'
    )

    class Meta:
        model = Path
        fields = (
            'id', 'url', 'display', 'name', 'description', 'tags', 'custom_fields', 'data'
        )
