from django.urls import path
from . import models, views
from netbox.views.generic import ObjectChangeLogView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('paths/', views.PathListView.as_view(), name='path_list'),
    path('paths/add/', views.PathEditView.as_view(), name='path_add'),
    path('paths/<int:pk>/', views.PathView.as_view(), name='path'),
    path('paths/<int:pk>/edit/', views.PathEditView.as_view(), name='path_edit'),
    path('paths/<int:pk>/delete/', views.PathDeleteView.as_view(), name='path_delete'),
    path('paths/<int:pk>/changelog/', ObjectChangeLogView.as_view(), name='path_changelog', kwargs={
        'model': models.Path
    }),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)