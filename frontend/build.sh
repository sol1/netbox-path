#!/bin/bash

LOCAL_DIR="dist/assets/static/netbox_path"
PLUGIN_DIR="../netbox_path/static/netbox_path"

mkdir -p $LOCAL_DIR
rm -rf dist/assets/*

npm run build && \
  mkdir -p $LOCAL_DIR
  
  cp -v dist/assets/index.*.js  $LOCAL_DIR/index.js && \
  cp -v dist/assets/index.*.css $LOCAL_DIR/index.css && \
  cp -v elements.json           $LOCAL_DIR/elements.json && \

  cp -v dist/assets/index.*.js  $PLUGIN_DIR/index.js && \
  cp -v dist/assets/index.*.css $PLUGIN_DIR/index.css && \
  cp -v elements.json           $PLUGIN_DIR/elements.json