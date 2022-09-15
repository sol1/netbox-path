# NetBox Path

This is a plugin for NetBox that allows you to create visual and queryable maps 
of logical paths within your infrastructure. This allows for impact assessment 
and monitoring integration.

The models are implemented using Cytoscape JS and built using Vite.

## Front-end development

* `cd frontend`
* `npm install`
* `npm run dev`

## Docker-based Netbox dev

* See https://gitlab.sol1.net/SOL1/netbox-path-docker
* `cd frontend && ./build.sh`

## To release

* `cd frontend && ./build.sh && cd $OLDPWD`
* Bump version in `netbox_path/__init__.py` and `setup.py`
* `python setup.py sdist` writes new tarball to `dist/`

## To deploy to a Netbox

* `cd /srv/netbox/current && source venv-py3/bin/activate`
* Add to Netbox's `local_requirements.txt` something like 

`netbox-path @ file:///srv/netbox/current/contrib/netbox_path-0.2.4.tar.gz`

* `./upgrade.sh`

Each user must create an API token with **write** permissions. The plugin will automatically use it.