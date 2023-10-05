from extras.plugins import PluginMenu, PluginMenuItem, PluginMenuButton
from utilities.choices import ButtonColorChoices

add_button = [
    PluginMenuButton(
        link='plugins:netbox_path:path_add',
        title='Add',
        icon_class='mdi mdi-plus-thick',
        color=ButtonColorChoices.GREEN,
        permissions=["netbox_path.add_path"],
    )
]

menu = PluginMenu(
    label='Paths',
    groups=(
        ('Paths', (
            PluginMenuItem(link='plugins:netbox_path:path_list',link_text='Paths', buttons=add_button, permissions=['netbox_path.view_path']),
        )),
    ),
    icon_class='mdi mdi-map-marker-path'
)
