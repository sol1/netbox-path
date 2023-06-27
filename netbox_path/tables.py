import django_tables2 as tables
from netbox.tables import NetBoxTable
from .models import Path

class PathTable(NetBoxTable):
    name = tables.Column(
        linkify=True
    )
    
    class Meta(NetBoxTable.Meta):
        model = Path
        fields = ('pk', 'id', 'name', 'description', 'actions')
        default_columns = ('name', 'description')
    