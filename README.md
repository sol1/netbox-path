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

* `cd frontend && ./build.sh`
* `docker-compose down && docker-compose build --no-cache && docker-compose up --force-recreate`