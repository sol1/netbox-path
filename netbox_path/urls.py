from django.urls import path
from . import models, views
from netbox.views.generic import ObjectChangeLogView, ObjectJournalView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('paths/', views.PathListView.as_view(), name='path_list'),
    path('paths/add/', views.PathEditView.as_view(), name='path_add'),
    path('paths/<int:pk>/', views.PathView.as_view(), name='path'),
    path('paths/<int:pk>/edit/', views.PathEditView.as_view(), name='path_edit'),
    path('paths/<int:pk>/delete/', views.PathDeleteView.as_view(), name='path_delete'),
    path('paths/<int:pk>/contacts/', views.PathContactsView.as_view(), name='path_contacts'),
    path('paths/<int:pk>/changelog/', ObjectChangeLogView.as_view(), name='path_changelog', kwargs={"model": models.Path}),
    path('paths/<int:pk>/journal/', ObjectJournalView.as_view(), name='path_journal', kwargs={"model": models.Path}),
    path('dcim/devices/<int:pk>/paths/', views.DevicePaths.as_view(), name="device_paths"),
    path('dcim/interfaces/<int:pk>/paths/', views.InterfacePaths.as_view(), name="interface_paths"),
    path('virtualization/interfaces/<int:pk>/paths/', views.VMInterfacePaths.as_view(), name="vminterface_paths"),
    path('circuits/circuits/<int:pk>/paths/', views.CircuitPaths.as_view(), name="circuit_paths"),
    path('ipam/vlans/<int:pk>/paths/', views.VLANPath.as_view(), name="vlan_paths"),
    path('dcim/racks/<int:pk>/paths/', views.RackPath.as_view(), name="rack_paths"),
    path('dcim/regions/<int:pk>/paths/', views.RegionPath.as_view(), name="region_paths"),
    path('dcim/sites/<int:pk>/paths/', views.SitePath.as_view(), name="site_paths"),
    path('tenancy/tenants/<int:pk>/paths/', views.TenantPath.as_view(), name="tenant_paths"),
    path('virtualization/virtual-machines/<int:pk>/paths/', views.VirtualMachinePath.as_view(), name="virtualmachine_paths"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)