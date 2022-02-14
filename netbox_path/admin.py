import imp
from django.contrib import admin
from .models import Path

@admin.register(Path)
class PathAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')