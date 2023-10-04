from netbox.api.serializers import NetBoxModelSerializer
from rest_framework import serializers
from ..models import Path

class NestedPathSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_path-api:path-detail')

    class Meta:
        model = Path
        fields = (
            'id', 'url', 'display', 'name', 'description', 'tags', 'custom_fields', 'graph'
        )

class PathSerializer(NetBoxModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name='plugins-api:netbox_path-api:path-detail')
    class Meta:
        model = Path
        fields = (
            'id', 'url', 'display', 'name', 'description', 'tags', 'custom_fields', 'graph'
        )