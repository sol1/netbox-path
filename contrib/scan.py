import requests

OBJECT_ID = 109
OBJECT_TYPE = 'dcim.devices'

HOST = 'netbox-path.sol1.net'
API_KEY = '506f3020a10a35d71ca21939abc67e7e90db493b'

cached_objects = {}
visited_edges = []
visited_nodes = []
visited_graphs = []

affected_objects = []
affected_paths = []

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Token {API_KEY}',
}

def check_edges(node_key, node, object):
    node_key = node['id']
    node_type = node['object']['type']
    node_id = node['object']['id']

    print(f'Found node {node_key} {node_type} {node_id}')
    if node_key not in visited_nodes:
        if f'{node_type}:{node_id}' not in affected_objects:
            affected_objects.append(f'{node_type}:{node_id}')
        visited_nodes.append(node_key)
        try:
            for edge in object['graph']['elements']['edges']:
                edge_key = edge['data']['id']
                edge_source = edge['data']['source']
                edge_target = edge['data']['target']
                if edge_source == node_key:
                    if edge_key not in visited_edges:
                        visited_edges.append(edge_key)
                        print(f'Found edge {edge_key} {edge_source}->{edge_target}')
                        child_node_key = edge['data']['target']
                        for child_node in object['graph']['elements']['nodes']:
                            #print(child_node_key, child_node['data']['id'])
                            if child_node['data']['id'] == child_node_key:
                                print(f'Iterate over children of {child_node["data"]["id"]}')
                                check_object(child_node['data']['object']['id'], child_node['data']['object']['type'])
                                if child_node_key not in visited_nodes:
                                    visited_nodes.append(child_node_key)
                    else:
                        print(f'Already visited edge {edge_key}')
        except Exception as e:
            print('No edges found')
    else:
        print(f'Already visited node {node_key}')

def check_object(object_id, object_type):
    object_type = object_type.replace('.', '/')
    if f'{object_type}:{object_id}' in cached_objects:
        print(f'Already visited this node using cached response {object_type} {object_id}')
        response = cached_objects[f'{object_type}:{object_id}']
    else:
        response = requests.get(f'https://{HOST}/api/plugins/netbox-path/paths/{object_type}/{object_id}/', headers=headers).json()
        print(f'Requesting paths for {object_type} {object_id} https://{HOST}/api/plugins/netbox-path/paths/{object_type}/{object_id}/')
        if object_type == OBJECT_TYPE and object_id == OBJECT_ID:
            if response['id'] not in affected_paths:
                affected_paths.append(response['id'])
        cached_objects[f'{object_type}:{object_id}'] = response
    
    object_type = object_type.replace('/', '.')
    for object in response:
        path_id = object['id']
        print(f'Visiting path {path_id}')
        if path_id not in visited_graphs:
            visited_graphs.append(path_id)

        for node in object['graph']['elements']['nodes']:
            node = node['data']
            node_key = node['id']
            if node['object']['type'] == object_type and node['object']['id'] == object_id:
                check_edges(node_key, node, object)

def get_contacts():
    response = requests.get(f'https://{HOST}/api/tenancy/contact-assignments/', headers=headers).json()
    for object in affected_objects:
        type = object.split(':')[0].rsplit('s', 1)[0]
        id = object.split(':')[1]
        print(f'Checking contacts for {type} {id}')
        for assignment in response['results']:
            if assignment['content_type'] == type and assignment['object_id'] == int(id):
                contact_response = requests.get(assignment['contact']['url'], headers=headers).json()
                print(f'{type} {id} - Contact {contact_response["name"]} {contact_response["email"]} {contact_response["phone"]}')
    #print(response)
def get_path_contacts():
    response = requests.get(f'https://{HOST}/api/tenancy/contact-assignments/', headers=headers).json()
    for path in visited_graphs:
        for assignment in response['results']:
            if assignment['content_type'] == 'netbox_path.path' and assignment['object_id'] == int(path):
                contact_response = requests.get(assignment['contact']['url'], headers=headers).json()
                print(f'Path {path} - Contact {contact_response["name"]} {contact_response["email"]} {contact_response["phone"]}')

check_object(OBJECT_ID, OBJECT_TYPE)
#get_contacts()
get_path_contacts()

print('')
print(f'Visited graphs: {visited_graphs}')
print(f'Visited nodes: {visited_nodes}')
print(f'Visited edges: {visited_edges}')
