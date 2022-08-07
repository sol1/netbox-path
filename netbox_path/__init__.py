from extras.plugins import PluginConfig

class NetBoxPathConfig(PluginConfig):
    name = 'netbox_path'
    verbose_name = 'Netbox Path'
    description = 'Create visual and queryable maps of logical paths within your infrastructure'
    version = '0.2'
    author = 'Andrew Foster'
    author_email = 'support@sol1.com.au'
    base_url = 'paths'
    required_settings = []
    min_version = '3.2.0'
    max_version = '3.2.99'
    default_settings = {
        'device_ext_page': 'right',
        'asdot': False
    }

config = NetBoxPathConfig