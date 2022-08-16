=====
Netbox Path
=====

This is a plugin for NetBox that allows you to create visual and queryable maps 
of logical paths within your infrastructure. This allows for impact assessment 
and monitoring integration.

The models are implemented using Cytoscape JS and built using Vite.

Quick start
-----------

1. Add "netbox_path" to your INSTALLED_APPS setting like this::

    INSTALLED_APPS = [
        ...
        'netbox_path',
    ]

2. Run ``python manage.py migrate`` to create the path models.

3. Start the development server and visit http://127.0.0.1:8000/plugins/netbox-path/paths/
   to create a new path object.