from netbox.api.routers import NetBoxRouter
from . import views

app_name = 'netbox_path'

router = NetBoxRouter()
router.register('paths', views.PathViewSet)

urlpatterns = router.urls
