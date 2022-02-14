from extras.plugins import PluginConfig

class PathConfig(PluginConfig):
    name = 'netbox_path'
    verbose_name = 'Path'
    description = 'A plugin that allows users to map logical paths in infrastructure and attach them to devices, IPs, interfaces and virtual machines'
    version = '0.1'
    author = 'Paul Damiani'
    author_email = 'paul.damiani@sol1.com.au'
    base_url = 'path'
    required_settings = []
    min_version = '3.1.0'
    max_version = '3.1.99'
    default_settings = {
        'device_ext_page': 'right',
        'asdot': False
    }

config = PathConfig