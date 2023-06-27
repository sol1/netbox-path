from extras.plugins import PluginMenu, PluginMenuItem, PluginMenuButton

menu = PluginMenu(
    label='Paths',
    groups=(
        ('Paths', (
            PluginMenuItem(link='plugins:netbox_path:path_list',link_text='Paths'),
        )),
    ),
    icon_class='mdi mdi-map-marker-path'
)
