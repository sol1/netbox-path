from netbox.api.viewsets import NetBoxModelViewSet, BaseViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .. import filtersets, models
from .serializers import PathSerializer


class PathViewSet(NetBoxModelViewSet):
    queryset = models.Path.objects.prefetch_related('tags')
    serializer_class = PathSerializer

    # Device objects

    @action(detail=False, methods=["get"], url_path=r'dcim/devices/(?P<pk>[^/.]+)')
    def device(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.devices', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/devices')
    def devices(self, request):
        serializer = PathSerializer(filter_queryset('dcim.devices', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # VLan objects

    @action(detail=False, methods=["get"], url_path=r'ipam/vlans/(?P<pk>[^/.]+)')
    def vlan(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('ipam.vlans', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'ipam/vlans')
    def vlans(self, request):
        serializer = PathSerializer(filter_queryset('ipam.vlans', None), many=True, context={'request': request})
        return Response(serializer.data)


    # Rack objects

    @action(detail=False, methods=["get"], url_path=r'dcim/racks/(?P<pk>[^/.]+)')
    def rack(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.racks', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/racks')
    def racks(self, request):
        serializer = PathSerializer(filter_queryset('dcim.racks', None), many=True, context={'request': request})
        return Response(serializer.data)


    # Region objects

    @action(detail=False, methods=["get"], url_path=r'dcim/regions/(?P<pk>[^/.]+)')
    def region(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.regions', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/regions')
    def regions(self, request):
        serializer = PathSerializer(filter_queryset('dcim.regions', None), many=True, context={'request': request})
        return Response(serializer.data)

    
    # Site objects

    @action(detail=False, methods=["get"], url_path=r'dcim/sites/(?P<pk>[^/.]+)')
    def site(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.sites', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/sites')
    def sites(self, request):
        serializer = PathSerializer(filter_queryset('dcim.sites', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # Tenant objects
    
    @action(detail=False, methods=["get"], url_path=r'tenancy/tenants/(?P<pk>[^/.]+)')
    def tenant(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('tenancy.tenants', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'tenancy/tenants')
    def tenants(self, request):
        serializer = PathSerializer(filter_queryset('tenancy.tenants', None), many=True, context={'request': request})
        return Response(serializer.data)

    # Virtual Machine objects

    @action(detail=False, methods=["get"], url_path=r'virtualization/virtual-machines/(?P<pk>[^/.]+)')
    def virtual_machine(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('virtualization.virtual-machines', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'virtualization/virtual-machines/')
    def virtual_machines(self, request):
        serializer = PathSerializer(filter_queryset('virtualization.virtual-machines', None), many=True, context={'request': request})
        return Response(serializer.data)

def filter_queryset(type, pk):
    if pk is not None:
        return models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'object': { 'id': int(pk), 'type': type}}}])
    else:
        return models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'object': {'type': type}}}])