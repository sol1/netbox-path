#!/bin/bash

LOCAL_DIR="dist/assets/static/netbox_path"
PLUGIN_DIR="../netbox_path/static/netbox_path"

mkdir -p $LOCAL_DIR
rm -rf dist/assets/*

npm run build && \
  mkdir -p $LOCAL_DIR
  mkdir -p $PLUGIN_DIR
  
  cp -v dist/assets/index.*.js  $LOCAL_DIR/index.js && \
  cp -v dist/assets/index.*.css $LOCAL_DIR/index.css && \

  cp -v dist/assets/index.*.js  $PLUGIN_DIR/index.js && \
  cp -v dist/assets/index.*.css $PLUGIN_DIR/index.css
