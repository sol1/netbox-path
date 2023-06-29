import './style.css'
import cytoscape from 'cytoscape';
import TomSelect from 'tom-select';

var path, cy, objectProperties, netboxObjectSelect, selectedObject, queryVal, authToken, currUser
var queryUrl = '/api/dcim/devices/?limit=100'
var qureyFilters = []
var filters = []

document.addEventListener('DOMContentLoaded', () => {

  // const writeNodeSelect = () => {
  //   // var nodeSelect = emptyNodeSelect()
  //   cy.nodes().forEach(ele => {
  //     var opt = document.createElement('option')
  //     opt.innerHTML = ele.data('label')
  //     opt.setAttribute('value', ele.id())
  //     nodeSelect.appendChild(opt)
  //   })
  // }

  // Get the current user from the API
  fetch(`/api/users/users/${currentUserId}/`)
    .then(response => response.json())
    .then(data => {
      currUser = data
    }).then(() => {
      // Try and fetch a write enabled token
      fetch('/api/users/tokens/')
        .then(response => response.json())
        .then(data => {
          var tokens = data.results
          // Iterate through the tokens
          for (var i = 0; i < tokens.length; i++) {
            // Check if the token has write permissions
            if (tokens[i].user['id'] == currUser.id && tokens[i].write_enabled) {
              // If the token expiry is null
              if (tokens[i].expires === null) {
                // Set the current token to that key
                authToken = tokens[i].key
                // Break out of the loop
                break
              } else {
                // If the token expiry is not null
                // Parse the token expiry into a date object
                var tokenExpiry = new Date(tokens[i].expires)
                // If the token expiry is in the future
                if (tokenExpiry > new Date()) {
                  // Set the current token to that key
                  authToken = tokens[i].key
                  // Break out of the loop
                  break
                }
              }
            }
          }
          // If no token was found print a warning
          if (authToken === undefined) {
            // Insert a warning message into the page
            var warning = document.createElement('div')
            warning.setAttribute('class', 'alert alert-warning mt-3')
            warning.innerHTML = 'No write enabled token found for ' + currUser.display + ' user. Please create a token with write permissions.'
            document.getElementById('global-controls').appendChild(warning)
            // And disable the save button
            document.getElementById('nbp-save').disabled = true
          }
        })
      })

  // Initialize the object select box
  netboxObjectSelect = new TomSelect('#netbox-object-select', {
    valueField: 'id',
    labelField: 'display',
    searchField: 'display',
    options: [],
    preload: true,
    create: false,
    load: function(query, callback) {
      fetch(buildQuery())
        .then(response => response.json())
        .then(data => {
          var options = data.results
          callback(options)
        }).catch(error => {
          console.log(error)
        })
    },
    render: {
      option: function(item, escape) {
        var objectDetails = ''
        for (var key in item) {
          if (item[key] !== null && typeof item[key] === 'object' && "url" in item[key]) {
            objectDetails += `<div class="col">${escape(formatKey(key))}: <span class="text-muted">${item[key].display}</span></div>`
          }
        }
        return `<div class="d-flex">
                  <div class="mb-1">
                    <p class="h5">${ escape(item.display) }</p>
                    <div class="container">
                      <div class="row">
                        ${objectDetails}
                      </div>
                    </div>
                  </div>
                </div>`;
      },
    },
    onChange: function(value) {
      updateSelectedObject(value)
    },
    onType: function(str) {
      queryVal = str
    }
  });

  // Update the selected object when the select changes
  const updateQueryBase = (newBase) => {
    queryUrl = `/api/${newBase}/?limit=100`
  }

  // Update the query url with the current filters
  const updateQueryFilters = (object, filterValue) => {
    // If the filterValue is empty, remove the filter from the query
    if (filterValue === '') {
      qureyFilters = qureyFilters.filter(filter => filter.object !== object)
    } else {
      // We do manual object name comparisons here because sometimes the object name is different than the query name
      if (object === 'device_role') {
        object = 'role'
      }
      // If the object is already in the query, update the filter value
      var filter = qureyFilters.find(filter => filter.object === object)
      if (filter) {
        filter.filterValue = filterValue
      } else {
        qureyFilters.push({ object: object, filterValue: filterValue })
      }
    }
    updateObjectSelect()
  }

  // Reset the query filters array
  const resetQueryFilters = () => {
    qureyFilters = []
  }

  // Build the query URL with the current filters
  const buildQuery = () => {
    var query = queryUrl
    if (qureyFilters.length > 0) {
      query += '&'
      qureyFilters.forEach(filter => {
        query += `${filter.object}_id=${filter.filterValue}&`
        // If it is the last filter, remove the trailing &
        if (filter === qureyFilters[qureyFilters.length - 1]) {
          query = query.slice(0, -1)
        }
      })
    }
    // If the user typed in a search value, add it to the query
    if (queryVal) {
      query += `&q=${queryVal}`
    }
    return query
  }

  // Update the object select options
  const updateObjectSelect = () => {
    queryVal = ''
    netboxObjectSelect.clear(true)
    netboxObjectSelect.clearOptions()
    netboxObjectSelect.load(buildQuery())
    netboxObjectSelect.refreshOptions(false)
  }

  // Update the selected object with the given value from the object select
  const updateSelectedObject = (object) => {
    selectedObject = object
  }

  // Function to format the key for display
  const formatKey = (key) => {
    var keyParts = key.split('_')
    for (var i = 0; i < keyParts.length; i++) {
      keyParts[i] = keyParts[i].charAt(0).toUpperCase() + keyParts[i].slice(1)
    }
    return keyParts.join(' ')
  }

  // Function to create the new select element for the object type
  const createFilterSelectElement = (elementId, key) => {
    // Create a label for the select element
    var deviceTypeLabel = document.createElement('label')
    deviceTypeLabel.setAttribute('for', elementId)
    deviceTypeLabel.innerHTML = `Filter by: ${formatKey(key)}`
    document.getElementById('netbox-object-select-filter').appendChild(deviceTypeLabel)
    
    // Create a new select element for the device type
    var deviceTypeSelect = document.createElement('select')
    deviceTypeSelect.setAttribute('id', elementId)
    
    // Append the select element to the page
    document.getElementById('netbox-object-select-filter').appendChild(deviceTypeSelect)
  }

  // Function to create the filter select elements for the selected object type
  const createFilterSelect = () => {
    if (objectProperties) {
      var object = objectProperties
    } else {
      return
    }
    // Make a new filter select element for each property
    for (var key in object) {
      // Check if there is a URL in the object
      if (object[key] !== null && typeof object[key] === 'object' && "url" in object[key]) {

        // Get the url endpoint for the device type after the slash
        var splitUrl = object[key].url.split('/')
        var deviceTypeUrl = `/${splitUrl[3]}/${splitUrl[4]}/${splitUrl[5]}`

        // Generate the select box for the device type
        var deviceTypeSelectId = `${key}-type-filter`
        createFilterSelectElement(deviceTypeSelectId, key)

        // Initialize the select box for the filter type
        new TomSelect(`#${deviceTypeSelectId}`, {
          valueField: 'id',
          labelField: 'display',
          searchField: 'display',
          options: [],
          preload: true,
          create: false,
          load: function(query, callback) {
            var inputId = this.inputId
            var url = filters.filter(function(element){ return element.domId == inputId; })[0].url
            fetch(`${url}/?limit=100&q=${query}`)
              .then(response => response.json())
              .then(data => {
                var options = data.results
                callback(options)
              }).catch(error => {
                console.log(error)
              })
          },
          render: {
            option: function(item, escape) {
              var objectDetails = ''
              for (var key in item) {
                if (item[key] !== null && typeof item[key] === 'object' && "url" in item[key]) {
                  objectDetails += `<div class="col">${escape(formatKey(key))}: <span class="text-muted">${item[key].display}</span></div>`
                }
              }
              return `<div class="d-flex">
                        <div class="mb-1">
                          <p class="h5">${ escape(item.display) }</p>
                          <div class="container">
                            <div class="row">
                              ${objectDetails}
                            </div>
                          </div>
                        </div>
                      </div>`;
            },
          },
          onChange: function(e) {
            var inputId = this.inputId
            var key = filters.filter(function(element){ return element.domId == inputId; })[0].key
            var filterValue = e
            updateQueryFilters(key, filterValue)
          }
        });
        
        // Add the filter to the list of filters
        filters.push({ domId: deviceTypeSelectId, url: deviceTypeUrl, key: key })
      }
    }
    // If there are no filters, print a message to the user
    if (filters.length === 0) {
      var noFilters = document.createElement('p')
      noFilters.innerHTML = 'No filters available'
      document.getElementById('netbox-object-select-filter').appendChild(noFilters)
    }
  }

  // Change th list of filters when the object type is changed
  const changeFilters = () => {
    var objectTypeSelect = document.getElementById('netbox-object-type-select')
    var objectType = objectTypeSelect.options[objectTypeSelect.selectedIndex].getAttribute('value')

    // Set the label of the device select to the name of the selected object type
    var objectLabel = document.getElementById('netbox-object-select-label')
    var objectTypeLabel = objectTypeSelect.options[objectTypeSelect.selectedIndex].innerHTML
    
    // Drop the s from the end of the object type name
    if (objectTypeLabel.endsWith('s')) {
      objectTypeLabel = objectTypeLabel.slice(0, -1)
    }
    objectLabel.innerHTML = `Add ${objectTypeLabel}`

    updateQueryBase(objectType)
    updateObjectSelect()
    resetQueryFilters()

    filters = []

    // Clear the netbox-object-select-filter div
    var objectSelectFilter = document.getElementById('netbox-object-select-filter')
    objectSelectFilter.innerHTML = ''

    // Get the first object of the selected type from the API

    fetch(`/api/${objectType}/?limit=1`)
      .then(response => response.json())
      .then(data => {
        objectProperties = data.results[0]
      })
      .then(() => {
        createFilterSelect()
      })
  }

  changeFilters()

  const writeInspector = (ele) => {
    var insp = document.getElementById('nbp-inspector')
    insp.value = JSON.stringify(ele.data(), null, 2)
  }

  const saveState = () => {
    fetch(`/api/plugins/netbox-path/paths/${netboxPathId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        graph: cy.json(),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      credentials: 'omit'
    })
    .then((response) => response.json())
    .then((json) => console.log('Saved', json));
  }

  // const emptyNodeSelect = () => {
  //   var ele = document.getElementById('nbp-node-select')
  //   ele.innerHTML = ''
  //   return ele
  // }

  const deleteSelectedNodes = () => {
    var removed = cy.$(':selected').remove()

    // writeNodeSelect()
    // if (removed.length > 0) {
    //   cy.fit()
    // }
  }

  // Change what buttons are active based on the selected node
  const toggleButtons = selected => {
    var numSelected = selected.length

    if (numSelected > 0) {
      // Some stuff is selected. Activate action buttons
      document.getElementById('nbp-delete-selected').disabled = false
      document.getElementById('nbp-edit-selected').disabled = false
      
      if (cy.$('node:selected').length > 1) {
        document.getElementById('nbp-link-selected').disabled = false
        document.getElementById('nbp-edit-selected').disabled = true
      } else {
        document.getElementById('nbp-link-selected').disabled = true
      }
    } else {
      // Nothing selected - disable action buttons
      document.getElementById('nbp-delete-selected').disabled = true
      document.getElementById('nbp-link-selected').disabled = true
      document.getElementById('nbp-edit-selected').disabled = true
    }
  }

  // Change button text based on the selected node
  const labelButtons = selected => {
    var numSelected = selected.length

    if (numSelected > 1) {
      document.getElementById('nbp-add-node').innerHTML = `Add and link to ${numSelected} nodes`
      document.getElementById('nbp-delete-selected').innerHTML = `<span class="mdi mdi-trash-can-outline"></span> Delete ${numSelected} nodes`

      if (cy.$('node:selected').length > 1) {
        // The link button is only concerned with nodes as opposed to edges
        document.getElementById('nbp-link-selected').innerHTML = `Link ${numSelected} nodes`
      }

    } else if (numSelected === 1 && selected[0].group() == 'nodes') {
      document.getElementById('nbp-add-node').innerHTML = `Add and link to ${selected[0].data().netboxdata.name}`
      document.getElementById('nbp-delete-selected').innerHTML = `<span class="mdi mdi-trash-can-outline"></span> Delete`
      document.getElementById('nbp-link-selected').innerHTML = 'Link'

    } else {
      // Nothing selected
      document.getElementById('nbp-add-node').innerHTML = 'Add'
      document.getElementById('nbp-delete-selected').innerHTML = '<span class="mdi mdi-trash-can-outline"></span> Delete'
      document.getElementById('nbp-link-selected').innerHTML = 'Link'
    }
  }

  // Update the button text and disable/enable buttons based on the selected node
  const renderButtons = () => {
    var selected = cy.$(':selected')
    toggleButtons(selected)
    labelButtons(selected)
  }

  // Initialize the cytojs graph
  const initCytoscape = (graph) => {
    // Init empty graph
    cy = cytoscape({
      container: document.getElementById('nbp-cy'),
      layout: {
        name: 'grid',
        cols: 3,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'teal',
            'label': 'data(label)',
            'shape': 'roundrectangle',
            'width': '100',
            'height': '100',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'color': '#fff',
            'text-outline-color': 'teal',
            'text-outline-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': '4',
            'line-color': 'tan',
            'target-arrow-color': 'tan',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        },
        {
          selector: ':selected',
          style: {
            'background-color': '#f00',
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#f00',
            'text-outline-color': '#f00',
            'text-outline-width': 3,
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'node[group="nodes"]',
          style: {
            'background-color': '#f00',
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'edge[group="edges"]',
          style: {
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'node[group="nodes"]:selected',
          style: {
            'background-color': '#f00',
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
        {
          selector: 'edge[group="edges"]:selected',
          style: {
            'line-color': '#f00',
            'target-arrow-color': '#f00',
            'source-arrow-color': '#f00',
          }
        },
      ],
    })
    
    if (graph) {
      // Overlay data from server
      cy.json(graph)
    }
    
    cy.ready(() => {
      // Simplify starting point by unselecting everything
      cy.$('').unselect()
      renderButtons()

      // writeNodeSelect()
    })

    // Or just when nodes are selected
    // cy.on('select', 'node', () => {})
    cy.on('select', event => {
      // This fires once for every selected node and edge
      renderButtons()
    })

    cy.on('unselect', event => {
      renderButtons()
    })

    cy.on('remove', event => {
      renderButtons()
    })

    cy.on('tap', event => {
      var ele = event.target;
      console.log(ele)
      writeInspector(ele)
    })

    // If user clicks the destroy button, wipe local state and re-init from server data
    cy.on('destroy', () => {
      localStorage.removeItem('netbox-path')
      initCytoscape(path?.graph)
    })
  }

  // Fetch data from server and initialise Cytoscape
  // var graphP = fetch(netboxPathDataUrl).then(obj => obj.json())
  var fetchPath = fetch(`/api/plugins/netbox-path/paths/${netboxPathId}/`).then(obj => obj.json())

  Promise.all([ fetchPath ]).then(promises => {
    path = promises[0]
    initCytoscape(path.graph)

    document.querySelector('#nbp-add-node').addEventListener('click', () => {
      var added = []
      var selectedNameAttributes = {}
      
      // Get the selected value from netbox-object-type-select
      var selectedObjectType = document.getElementById('netbox-object-type-select')
      var objectUrl = selectedObjectType.options[selectedObjectType.selectedIndex].getAttribute('value')
      var fetchData = fetch(`/api/${objectUrl}/${selectedObject}/`).then((response) => response.json())

      // Set the label of the device select to the name of the selected object type
      var objectType = objectUrl.split('/')[1]
      var objectTypeLabel = formatKey(objectType);
      
      // Drop the s from the end of the object type name
      if (objectTypeLabel.endsWith('s')) {
        objectTypeLabel = objectTypeLabel.slice(0, -1)
      }

      Promise.all([ fetchData ]).then(promises => {
        var deviceData = promises[0]
        var deviceLabel = `${objectTypeLabel}`

        // Generate the initial label for the node
        if (deviceData.display) {
          deviceLabel += `\nDisplay: ${deviceData.display}`
          selectedNameAttributes['display'] = true
        }
        if (deviceData.device_type) {
          deviceLabel += `\nDevice type: ${deviceData.device_type.display}`
          selectedNameAttributes['device_type'] = true
        }
        if (deviceData.site) {
          deviceLabel += `\nSite: ${deviceData.site.display}`
          selectedNameAttributes['site'] = true
        }
        if (deviceData.tenant) {
          deviceLabel += `\nTenant: ${deviceData.tenant.display}`
          selectedNameAttributes['tenant'] = true
        }

        // Generate a random id for the new node
        var id = Math.random().toString(36).substring(7)
        
        // Create the new node
        var newNode = {
          group: 'nodes',
          data: {
            id: id,
            label: deviceLabel,
            netboxdata: deviceData,
            objectType: objectTypeLabel,
            selectedNameAttributes: selectedNameAttributes,
          },
        }

        if (cy.$('node:selected').length > 0) {
          let existing = cy.$('node:selected')[0]
          // Position the new node near one of the selected nodes
          // TODO can we do overlap avoidance?
          newNode.position = {
            x: existing.position('x') + 200,
            y: existing.position('y')
          }
        }

        // Add the new node
        added = added.concat(
          cy.add(newNode)
          )

        // Add an edge between all selected nodes and the new node
        cy.$('node:selected').forEach(s => {
          var newEdgeId = `edge-${s.id()}-${id}`
          if (cy.$id(newEdgeId).length === 0) {
            console.log("Adding new edge " + newEdgeId)
            let edge = { group: 'edges', data: { id: newEdgeId, source: s.id(), target: id } }
            added = added.concat( cy.add(edge) )
          }
        })

        if (added.length > 0) {

          // If we added anything, update stuff
          // writeNodeSelect()
          // cy.fit()
        }
      })
    })

    // Add listener for the save button
    document.querySelector('#nbp-save').addEventListener('click', () => {
      saveState()
    })

    // document.querySelector('#nbp-revert').addEventListener('click', () => {
    //   cy.destroy()
    // })

    // Add listener for the fit to size button
    document.querySelector('#nbp-fit').addEventListener('click', () => {
      cy.fit()
    })

    // document.querySelector('#nbp-node-select').addEventListener('change', event => {
    //   cy.$('').unselect() // deselect everything else
    //   cy.$('#' + event.target.value).select()
    // })

    // Add listener for the delete button
    document.querySelector('#nbp-delete-selected').addEventListener('click', () => {
      deleteSelectedNodes()

    })

    // Add listener for the link button
    document.querySelector('#nbp-link-selected').addEventListener('click', () => {
      // This doesn't pay much attention to ordering but we can't really know
      // that from the user's selection. Maybe we could look at their relative
      // position, and assume linking from left-to-right, top-to-bottom?
      //
      //
      var selected = cy.$('node:selected')

      // For now, create a link both ways, since we don't have a way to swap
      // an edge direction. Operator can delete the one they don't want.
      selected.forEach(a => {
        selected.forEach(b => {
          if (a.id() === b.id()) return

          var newEdgeId = `edge-${a.id()}-${b.id()}`
          if (cy.$id(newEdgeId).length === 0) {
            console.log("Adding new edge " + newEdgeId)
            let edge = { group: 'edges', data: { id: newEdgeId, source: a.id(), target: b.id() } }
            cy.add(edge)
          }
        })
      })
    })

    // Listen for when to delete a node from the graph
    document.addEventListener('keydown', event => {
      switch (event.code) {
        case 'Backspace':
        case 'Delete':
          deleteSelectedNodes()
        default:
          return
      }
    })

    // Check if the filter show/hide button is pressed
    document.getElementById('netbox-object-filter-showhide').addEventListener('click', () => {
      // Toggle the visibility of the filters
      var filter = document.getElementById('netbox-object-filters')
      if (filter.style.display === 'none') {
        filter.style.display = 'block'
      } else {
        filter.style.display = 'none'
      }

      // Change the button text
      var button = document.getElementById('netbox-object-filter-showhide')
      if (button.innerText === 'Show Filters') {
        button.innerText = 'Hide Filters'
      } else {
        button.innerText = 'Show Filters'
      }
    })

    document.getElementById('netbox-object-inspector-showhide').addEventListener('click', () => {
      // Toggle the visibility of the filters
      var filter = document.getElementById('netbox-object-inspector')
      if (filter.style.display === 'none') {
        filter.style.display = 'block'
      } else {
        filter.style.display = 'none'
      }

      // Change the button text
      var button = document.getElementById('netbox-object-inspector-showhide')
      if (button.innerText === 'Show Inspector') {
        button.innerText = 'Hide Inspector'
      } else {
        button.innerText = 'Show Inspector'
      }
    })

    // Check if the edit node button is pressed
    document.getElementById('nbp-edit-selected').addEventListener('click', () => {
      // Get the selected node
      var selected = cy.$('node:selected')
      if (selected.length === 0) {
        return
      }
      var node = selected[0]
      var netboxdata = node.data('netboxdata')

      // For every key in the netboxdata, create a checkbox and label
      var modalNodeAttributesSection = document.getElementById('node-attributes-to-show')
      modalNodeAttributesSection.innerHTML = ''
      for (var key in netboxdata) {
        if (netboxdata[key] === null || netboxdata[key] === undefined || Object.keys(netboxdata[key]).length === 0) {
          continue
        }

        var checkboxDiv = document.createElement('div')
        checkboxDiv.id = `node-checkbox-${key}`
        checkboxDiv.className = 'form-check col-md-6'

        var label = document.createElement('label')
        label.innerText = formatKey(key)
        label.className = "form-check-label"
        label.htmlFor = `node-attribute-${key}`
        checkboxDiv.appendChild(label)

        var checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = "form-check-input"
        if (node.data('selectedNameAttributes')[key] === true) {
          checkbox.checked = true
        } else {
          checkbox.checked = false
        }
        checkbox.id = `node-attribute-${key}`

        checkboxDiv.appendChild(checkbox)
        modalNodeAttributesSection.appendChild(checkboxDiv)
      }

    })

    // Check if the modal save button is pressed
    document.getElementById('nbp-node-edit-save').addEventListener('click', () => {
      // Get the selected node
      var selected = cy.$('node:selected')
      if (selected.length === 0) {
        return
      }
      var node = selected[0]
      var netboxdata = node.data('netboxdata')
      var selectedNameAttributes = {}
      var label = `${node.data('objectType')}`

      // Get the values submitted from the modal
      var modalNodeAttributesSection = document.getElementById('node-attributes-to-show')
      var checkboxes = modalNodeAttributesSection.querySelectorAll('.form-check-input')
      for (var i = 0; i < checkboxes.length; i++) {
        var checkbox = checkboxes[i]
        var key = checkbox.id.split('-')[2]
        
        if (checkbox.checked) {
          // Check if the netboxdata is an object
          if (typeof netboxdata[key] === 'object') {
            if (!netboxdata[key].display) {
              label += `\n${formatKey(key)}: ${netboxdata[key].label}`
            } else {
              label += `\n${formatKey(key)}: ${netboxdata[key].display}`
            }
          } else {
            label += `\n${formatKey(key)}: ${netboxdata[key]}`
          }
          selectedNameAttributes[key] = true
        }
      }
      node.data('label', label)
      node.data('selectedNameAttributes', selectedNameAttributes)
    })

    // Get the value of the object type when the user selects it
    document.getElementById('netbox-object-type-select').addEventListener('change', function() {
      changeFilters()
    })
  });
})