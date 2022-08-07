# NetBox Path

This is a plugin for NetBox that allows you to create visual and queryable maps 
of logical paths within your infrastructure. This allows for impact assessment 
and monitoring integration.

The models are implemented using Cytoscape JS and built using Vite.

## Front-end development

* `cd frontend`
* `npm install`
* `npm run dev`

## Building

```
cd frontend

rm -rf dist/* &&
    npm run build && \
    cp dist/assets/index.*.js ../netbox_path/static/netbox_path/index.js && \
    cp dist/assets/index.*.css ../netbox_path/static/netbox_path/index.css
```

