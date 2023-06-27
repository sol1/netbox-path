from netbox.views import generic
from utilities.views import ViewTab, register_model_view
from django_tables2 import RequestConfig
from django.db.models import Q
from virtualization.models import VirtualMachine
from tenancy.models import Tenant
from dcim.models import Device, Rack, Region, Site
from ipam.models import VLAN
from django.shortcuts import render
from django.views import View
import json
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

@register_model_view(Device, name='device_paths', path='paths')
class DevicePaths(generic.ObjectView):
    template_name = 'netbox_path/device.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Device'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Device.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})

    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Device'}}]))
    
@register_model_view(VLAN, name='vlan_paths', path='paths')
class VLANPath(generic.ObjectView):
    template_name = 'netbox_path/vlan.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Vlan'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': VLAN.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Vlan'}}]))

@register_model_view(Rack, name='rack_paths', path='paths')
class RackPath(generic.ObjectView):
    template_name = 'netbox_path/rack.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Rack'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Rack.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Rack'}}]))

@register_model_view(Region, name='rack_paths', path='paths')
class RegionPath(generic.ObjectView):
    template_name = 'netbox_path/region.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Region'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Region.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Region'}}]))
    
@register_model_view(Site, name='site_paths', path='paths')
class SitePath(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Site'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Site.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Site'}}]))
    
@register_model_view(Tenant, name='tenant_paths', path='paths')
class TenantPath(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Tenant'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Tenant.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Tenant'}}]))

@register_model_view(VirtualMachine, name='virtualmachina_paths', path='paths')
class VirtualMachinePath(generic.ObjectView):
    template_name = 'netbox_path/virtualmachine.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(x.pk)}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Virtual-machine'}}])).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': VirtualMachine.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return models.Path.objects.filter(Q(graph__elements__nodes__contains=[{'data': {'netboxdata': {'id': int(self.kwargs['pk'])}}}]) &  Q(graph__elements__nodes__contains=[{'data': {'objectType': 'Virtual-machine'}}]))

