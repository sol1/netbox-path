from .. import filtersets, models

from tenancy.models import ContactAssignment
from virtualization.models import VirtualMachine, VMInterface
from tenancy.models import Tenant
from dcim.models import Device, Rack, Region, Site, Interface
from ipam.models import VLAN
from circuits.models import Circuit

from django.contrib.contenttypes.models import ContentType
from django.forms.models import model_to_dict

class ImpactAssessment:

    def __init__(self, object_type, object_id):
        self.object_type = object_type
        self.object_id = int(object_id)

        self.source_nodes = {}
        self.all_nodes = {}

        self.edge_groups = []

        self.affected_nodes = {}
        self.affected_paths = []
        self.affected_edges = []

    def get_object_paths(self):
        paths = models.Path.objects.filter(graph__elements__nodes__contains=[{'data': {'object': { 'id': self.object_id, 'type': self.object_type}}}])
        return paths
    
    def parse_contacts(self, contact_assignments):
        result = []
        for assignment in contact_assignments:
            contact_dict = model_to_dict(assignment.contact)
            contact_dict['role'] = model_to_dict(assignment.role)

            result.append(contact_dict)
        return result

    def parse_path(self, path):
        result = {
            'id': path.id,
            'name': path.name,
            'description': path.description,
            'contacts': self.parse_contacts(path.contacts.all()),
            'objects': self.clean_nodes(self.affected_nodes[path.id]),
        }
        return result
    
    def get_impact(self):
        paths = self.get_object_paths()

        for path in paths:
            self.affected_nodes[path.id] = []

            self.all_nodes = {}
            self.source_nodes = {}

            self.parse_nodes(path)
            self.get_edge_groups(path)
            self.check_nodes(self.object_type, self.object_id, path, source=True)
            self.affected_paths.append(self.parse_path(path))
        
        return self.affected_paths
    
    def clean_nodes(self, lst):
        lst = list({i['id']:i for i in reversed(lst)}.values())
        for i, d in enumerate(lst):
            lst[i] = d['object']
            if 'description' in d:
                lst[i]['description'] = d['description']
            else:
                lst[i]['description'] = ''
            content_type = ContentType.objects.get_for_model(self.get_object(lst[i]))
            assignments = ContactAssignment.objects.filter(object_id=int(lst[i]['id']), content_type=content_type)
            lst[i]['contacts'] = self.parse_contacts(assignments)
        return lst    
    
    def parse_nodes(self, path):
        for node in path.graph['elements']['nodes']:
            if node['data']['object']['id'] == self.object_id and node['data']['object']['type'] == self.object_type:
                self.source_nodes[node['data']['id']] = node
            self.all_nodes[node['data']['id']] = node
            
        return self.source_nodes
    
    def parse_edge_group(self, edge):
        edge_label = edge['data']['label']
        edge_style = edge['data']['style']
        edge_color = edge['data']['color']

        return f'{edge_label}-{edge_color}-{edge_style}'
    
    def get_edge_groups(self, path):
        for edge in path.graph['elements']['edges']:
            if edge['data']['source'] in self.source_nodes:
                edge_group = self.parse_edge_group(edge)
                if edge_group not in self.edge_groups:
                    self.edge_groups.append(edge_group)
        return self.edge_groups
    
    def check_nodes(self, type, id, path, source=False):
        for node in path.graph['elements']['nodes']:
            if node['data']['id'] in self.affected_nodes[path.id]:
                continue
            if node['data']['object']['id'] == id and node['data']['object']['type'] == type:
                if not source:
                    node = self.set_node_direction(node, 'downstream')
                else:
                    node['data']['object']['direction'] = []
                self.affected_nodes[path.id].append(node['data'])
                self.check_edges(node['data']['id'], path, source)
    
    def check_edges(self, id, path, source):
        for edge in path.graph['elements']['edges']:
            if edge['data']['id'] in self.affected_edges:
                continue
            if edge['data']['source'] == id:
                edge_group = self.parse_edge_group(edge)
                if edge_group in self.edge_groups:
                    self.affected_edges.append(edge['data']['id'])
                    node = self.all_nodes[edge['data']['target']]
                    self.check_nodes(node['data']['object']['type'], node['data']['object']['id'], path)
            if source and edge['data']['target'] == id:
                self.affected_edges.append(edge['data']['id'])
                node = self.all_nodes[edge['data']['source']]
                node = self.set_node_direction(node, 'upstream')
                self.affected_nodes[path.id].append(node['data'])
    
    def set_node_direction(self, node, direction):
        if 'direction' not in node['data']['object']:
            node['data']['object']['direction'] = []
        
        if direction not in node['data']['object']['direction']:
            node['data']['object']['direction'].append(direction)

        return node

    def get_object(self, object):
        type = object['type']
        id = object['id']

        if type == 'dcim.devices':
            return Device.objects.get(pk=id)
        elif type == 'dcim.interfaces':
            return Interface.objects.get(pk=id)
        elif type == 'virtualization.interfaces':
            return VMInterface.objects.get(pk=id)
        elif type == 'circuits.circuits':
            return Circuit.objects.get(pk=id)
        elif type == 'ipam.vlans':
            return VLAN.objects.get(pk=id)
        elif type == 'dcim.racks':
            return Rack.objects.get(pk=id)
        elif type == 'dcim.regions':
            return Region.objects.get(pk=id)
        elif type == 'dcim.sites':
            return Site.objects.get(pk=id)
        elif type == 'tenancy.tenants':
            return Tenant.objects.get(pk=id)
        elif type == 'virtualization.virtual-machines':
            return VirtualMachine.objects.get(pk=id)


