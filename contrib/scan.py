import requests

OBJECT_ID = 1
OBJECT_TYPE = 'dcim.devices'

HOST = 'localhost:8000'
API_KEY = ''

cached_objects = {}
visited_edges = []
visited_nodes = []
visited_graphs = []

def check_edges(node_key, node, object):
    print(f'Found node {node_key} {node["type"]} {node["id"]}')
    if node_key not in visited_nodes:
        visited_nodes.append(node_key)
    for edge in object['graph']['edges']:
        edge_key = edge['key']
        if edge_key not in visited_edges:
            visited_edges.append(edge_key)
            if edge['source'] == node_key:
                child_node_key = edge['target']
                for child_node in object['graph']['nodes']:
                    #print(child_node_key, child_node['key'])
                    if child_node['key'] == child_node_key:
                        print(f'Iterate over children of {child_node}')
                        check_object(child_node['attributes']['object']['id'], child_node['attributes']['object']['type'])
                        if child_node_key not in visited_nodes:
                            visited_nodes.append(child_node_key)

        else:
            print(f'Already visited edge {edge_key}')

def check_object(object_id, object_type):
    object_type = object_type.replace('.', '/')
    if f'{object_type}:{object_id}' in cached_objects:
        print(f'Already visited this node using cached response {object_type} {object_id}')
        response = cached_objects[f'{object_type}:{object_id}']
    else:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Token {API_KEY}',
        }
        response = requests.get(f'http://{HOST}/api/plugins/netbox-path/paths/{object_type}/{object_id}/', headers=headers).json()
        print(f'Requesting paths for {object_type} {object_id} http://{HOST}/api/plugins/netbox-path/paths/{object_type}/{object_id}/')
        cached_objects[f'{object_type}:{object_id}'] = response
    
    object_type = object_type.replace('/', '.')
    for object in response:
        path_id = object['id']
        print(f'Visiting path {path_id}')
        if path_id not in visited_graphs:
            visited_graphs.append(path_id)

        for node in object['graph']['nodes']:
            node_key = node['key']
            node = node['attributes']['object']
            if node['type'] == object_type and node['id'] == object_id:
                check_edges(node_key, node, object)


check_object(OBJECT_ID, OBJECT_TYPE)

print('')
print(f'Visited graphs: {visited_graphs}')
print(f'Visited nodes: {visited_nodes}')
print(f'Visited edges: {visited_edges}')
