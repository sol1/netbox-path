from netbox.api.routers import NetBoxRouter
from . import views

app_name = 'netbox_path'

router = NetBoxRouter()
router.register(r'paths', views.PathViewSet)
router.register(r'impact', views.ImpactViewSet, basename='impact-assessment')

urlpatterns = router.urls
