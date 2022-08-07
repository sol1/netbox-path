from netbox.forms import NetBoxModelForm
from .models import Path

class PathForm(NetBoxModelForm):

    class Meta:
        model = Path
        fields = ('name', 'description', 'tags')