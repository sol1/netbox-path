from netbox.search import SearchIndex, register_search
from models import Path

@register_search
class PathIndex(SearchIndex):
    model = Path
    fields = (
        ('name', 100),
        ('description', 5000),
    )