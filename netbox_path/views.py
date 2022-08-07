from netbox.views import generic
from . import forms, models, tables

class PathView(generic.ObjectView):
    queryset = models.Path.objects.all()

class PathListView(generic.ObjectListView):
    queryset = models.Path.objects.all()
    table = tables.PathTable

class PathEditView(generic.ObjectEditView):
    queryset = models.Path.objects.all()
    form = forms.PathForm

class PathDeleteView(generic.ObjectDeleteView):
    queryset = models.Path.objects.all()