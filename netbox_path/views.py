from netbox.views import generic
from utilities.views import ViewTab, register_model_view
from virtualization.models import VirtualMachine, VMInterface
from tenancy.models import Tenant
from dcim.models import Device, Rack, Region, Site, Interface
from tenancy.views import ObjectContactsView
from ipam.models import VLAN
from circuits.models import Circuit
from django.shortcuts import render
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

@register_model_view(models.Path, 'contacts')
class PathContactsView(ObjectContactsView):
    queryset = models.Path.objects.all()

@register_model_view(Device, name='device_paths', path='paths')
class DevicePaths(generic.ObjectView):
    template_name = 'netbox_path/device.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('dcim.devices', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Device.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})

    def get_queryset(self, *args, **kwargs):
        return filter_queryset('dcim.devices', self.kwargs['pk'])
    
@register_model_view(Interface, name='interface_paths', path='paths')
class InterfacePaths(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('dcim.interfaces', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Interface.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})

    def get_queryset(self, *args, **kwargs):
        return filter_queryset('dcim.interfaces', self.kwargs['pk'])
    
@register_model_view(VMInterface, name='vminterface_paths', path='paths')
class VMInterfacePaths(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('virtualization.interfaces', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': VMInterface.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})

    def get_queryset(self, *args, **kwargs):
        return filter_queryset('virtualization.interfaces', self.kwargs['pk'])
    
@register_model_view(Circuit, name='circuit_paths', path='paths')
class CircuitPaths(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('circuits.circuits', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Circuit.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})

    def get_queryset(self, *args, **kwargs):
        return filter_queryset('circuits.circuits', self.kwargs['pk'])
    
@register_model_view(VLAN, name='vlan_paths', path='paths')
class VLANPath(generic.ObjectView):
    template_name = 'netbox_path/vlan.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('ipam.vlans', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': VLAN.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('ipam.vlans', self.kwargs['pk'])

@register_model_view(Rack, name='rack_paths', path='paths')
class RackPath(generic.ObjectView):
    template_name = 'netbox_path/rack.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('dcim.racks', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Rack.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('dcim.racks', self.kwargs['pk'])

@register_model_view(Region, name='rack_paths', path='paths')
class RegionPath(generic.ObjectView):
    template_name = 'netbox_path/region.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('dcim.regions', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Region.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('dcim.regions', self.kwargs['pk'])
    
@register_model_view(Site, name='site_paths', path='paths')
class SitePath(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('dcim.sites', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Site.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('dcim.sites', self.kwargs['pk'])
    
@register_model_view(Tenant, name='tenant_paths', path='paths')
class TenantPath(generic.ObjectView):
    template_name = 'netbox_path/site.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('tenancy.tenants', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': Tenant.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('tenancy.tenants', self.kwargs['pk'])

@register_model_view(VirtualMachine, name='virtualmachine_paths', path='paths')
class VirtualMachinePath(generic.ObjectView):
    template_name = 'netbox_path/virtualmachine.html'
    tab = ViewTab(
        label='Paths',
        badge=lambda x: filter_queryset('virtualization.virtual-machines', x.pk).count(),
        hide_if_empty=False
    )

    def get(self, request, pk):
        return render(request, self.get_template_name(), {'object': VirtualMachine.objects.get(pk=int(pk)), 'tab': self.tab, 'table': tables.PathTable(self.get_queryset())})
    
    def get_queryset(self, *args, **kwargs):
        return filter_queryset('virtualization.virtual-machines', self.kwargs['pk'])


def filter_queryset(type, pk):
    return models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'object': { 'id': int(pk), 'type': type}}}])
