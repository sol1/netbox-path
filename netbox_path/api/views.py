from netbox.api.viewsets import NetBoxModelViewSet, BaseViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .. import filtersets, models
from .serializers import PathSerializer


class PathViewSet(NetBoxModelViewSet):
    queryset = models.Path.objects.prefetch_related('tags')
    serializer_class = PathSerializer

    # Device objects

    @action(detail=False, methods=["get"], url_path=r'device/(?P<pk>[^/.]+)')
    def device(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Device', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'device')
    def devices(self, request):
        serializer = PathSerializer(filter_queryset('Device', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # VLan objects

    @action(detail=False, methods=["get"], url_path=r'vlan/(?P<pk>[^/.]+)')
    def vlan(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Vlan', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'vlan')
    def vlans(self, request):
        serializer = PathSerializer(filter_queryset('Vlan', None), many=True, context={'request': request})
        return Response(serializer.data)


    # Rack objects

    @action(detail=False, methods=["get"], url_path=r'rack/(?P<pk>[^/.]+)')
    def rack(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Rack', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'rack')
    def racks(self, request):
        serializer = PathSerializer(filter_queryset('Rack', None), many=True, context={'request': request})
        return Response(serializer.data)


    # Region objects

    @action(detail=False, methods=["get"], url_path=r'region/(?P<pk>[^/.]+)')
    def region(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Region', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'region')
    def regions(self, request):
        serializer = PathSerializer(filter_queryset('Region', None), many=True, context={'request': request})
        return Response(serializer.data)

    
    # Site objects

    @action(detail=False, methods=["get"], url_path=r'site/(?P<pk>[^/.]+)')
    def site(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Site', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'site')
    def sites(self, request):
        serializer = PathSerializer(filter_queryset('Site', None), many=True, context={'request': request})
        return Response(serializer.data)
    
    # Tenant objects
    
    @action(detail=False, methods=["get"], url_path=r'tenant/(?P<pk>[^/.]+)')
    def tenant(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Tenant', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'tenant')
    def tenants(self, request):
        serializer = PathSerializer(filter_queryset('Tenant', None), many=True, context={'request': request})
        return Response(serializer.data)

    # Virtual Machine objects

    @action(detail=False, methods=["get"], url_path=r'virtual-machine/(?P<pk>[^/.]+)')
    def virtual_machine(self, request, pk=None):
        serializer = PathSerializer(filter_queryset('Virtual-machine', pk), many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path=r'virtual-machine')
    def virtual_machines(self, request):
        serializer = PathSerializer(filter_queryset('Virtual-machine', None), many=True, context={'request': request})
        return Response(serializer.data)

def filter_queryset(type, pk):
    if pk is not None:
        return models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'objectType': type, 'netboxdata': {'id': int(pk)}}}])
    else:
        return models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'objectType': type}}])