from netbox.api.viewsets import NetBoxModelViewSet
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .. import filtersets, models
from .serializers import PathSerializer
from .impact import ImpactAssessment

class ImpactViewSet(viewsets.ViewSet):
    queryset = models.Path.objects.all()

    def list(self, request):
        impact = ImpactAssessment(request.GET.get('type'), request.GET.get('id'))
        result = impact.get_impact()
        return Response(result)

class PathViewSet(NetBoxModelViewSet):
    queryset = models.Path.objects.prefetch_related('tags')
    serializer_class = PathSerializer

    # Image     
    @action(detail=False, methods=["get", "post"], url_path=r'(?P<pk>[^/.]+)/image')
    def get_image(self, request, pk=None):
        print(request)
        if request.method == "POST":
            models.Path.objects.filter(pk=pk).update(image=request.data['image'])
            return Response(status=200)
        path = models.Path.objects.get(pk=pk)
        return Response(path.image)

    # Device objects
    @action(detail=False, methods=["get"], url_path=r'dcim/devices/(?P<pk>[^/.]+)')
    def device(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.devices', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/devices')
    def devices(self, request):
        serializer = PathSerializer(filter_queryset('dcim.devices', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # Interface objects
    @action(detail=False, methods=["get"], url_path=r'dcim/interfaces/(?P<pk>[^/.]+)')
    def interface(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('dcim.interfaces', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'dcim/interfaces')
    def interfaces(self, request):
        serializer = PathSerializer(filter_queryset('dcim.interfaces', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # VM Interface objects
    @action(detail=False, methods=["get"], url_path=r'virtualization/interfaces/(?P<pk>[^/.]+)')
    def vminterface(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('virtualization.interfaces', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'virtualization/interfaces')
    def vminterfaces(self, request):
        serializer = PathSerializer(filter_queryset('virtualization.interfaces', None), many=True, context={'request': request})
        return Response(serializer.data)

    # Circuit objects
    @action(detail=False, methods=["get"], url_path=r'circuits/circuits/(?P<pk>[^/.]+)')
    def circuit(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('circuits.circuits', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'circuits/circuits')
    def circuits(self, request):
        serializer = PathSerializer(filter_queryset('circuits.circuits', None), many=True, context={'request': request})
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