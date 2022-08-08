import './style.css'
import cytoscape from 'cytoscape';

var path, cy

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

  const writeInspector = (ele) => {
    var insp = document.getElementById('nbp-inspector')
    insp.innerHTML = JSON.stringify(ele.data(), null, 2)
  }

  const saveState = () => {
    fetch(`/api/plugins/netbox-path/paths/${netboxPathId}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        graph: cy.json(),
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token 0123456789abcdef0123456789abcdef01234567`
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

  const toggleButtons = selected => {
    const initialClass = 'btn-outline-secondary'
    const deleteClass = 'btn-danger'
    const linkClass = 'btn-warning'

    var numSelected = selected.length

    if (numSelected > 0) {
      // Some stuff is selected. Activate action buttons
      document.getElementById('nbp-delete-selected').classList.replace(initialClass, deleteClass)
      document.getElementById('nbp-delete-selected').disabled = false
      
      if (cy.$('node:selected').length > 1) {
        // The link button is only concerned with nodes as opposed to edges
        document.getElementById('nbp-link-selected').classList.replace(initialClass, linkClass)
        document.getElementById('nbp-link-selected').disabled = false
      } else {
        document.getElementById('nbp-link-selected').classList.replace(linkClass, initialClass)
        document.getElementById('nbp-link-selected').disabled = true
      }
    } else {
      // Nothing selected - disable action buttons
      document.getElementById('nbp-delete-selected').classList.replace(deleteClass, initialClass)
      document.getElementById('nbp-delete-selected').disabled = true

      document.getElementById('nbp-link-selected').classList.replace(linkClass, initialClass)
      document.getElementById('nbp-link-selected').disabled = true
    }
  }

  const labelButtons = selected => {
    var numSelected = selected.length

    if (numSelected > 1) {
      document.getElementById('nbp-add-node').innerHTML = `Add and link to ${numSelected} nodes`
      document.getElementById('nbp-delete-selected').innerHTML = `Delete ${numSelected} nodes`

      if (cy.$('node:selected').length > 1) {
        // The link button is only concerned with nodes as opposed to edges
        document.getElementById('nbp-link-selected').innerHTML = `Link ${numSelected} nodes`
      }

    } else if (numSelected === 1 && selected[0].group() == 'nodes') {
      document.getElementById('nbp-add-node').innerHTML = `Add and link to ${selected[0].data().label}`
      document.getElementById('nbp-delete-selected').innerHTML = `Delete`
      document.getElementById('nbp-link-selected').innerHTML = 'Link'

    } else {
      // Nothing selected
      document.getElementById('nbp-add-node').innerHTML = 'Add'
      document.getElementById('nbp-delete-selected').innerHTML = 'Delete'
      document.getElementById('nbp-link-selected').innerHTML = 'Link'
    }
  }

  const renderButtons = () => {
    var selected = cy.$(':selected')
    toggleButtons(selected)
    labelButtons(selected)
  }

  const initCytoscape = (graph) => {
    // Init empty graph
    cy = cytoscape({
      container: document.getElementById('nbp-cy'),
      layout: {
        name: 'grid'
      },
      style: `
        node {
            background-color: teal;
            label: data(label);
            shape: roundrectangle;
            width: 40;
            height: 40;
        }
        node.has-been-selected {
            background-color: black;
        }
        node:selected {
            background-color: red;
        }
        edge {
            width: 4;
            line-color: tan;
            target-arrow-color: tan;
            target-arrow-shape: triangle;
            curve-style: bezier;
        }
        edge:selected {
            line-color: red;
            target-arrow-color: red;
        }
      `
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

      // Get the value of the device select
      var deviceSelect = document.getElementById('netbox-device-select')
      var selectedDevice = deviceSelect.options[deviceSelect.selectedIndex].getAttribute('data-display')

      var newNode = {
        group: 'nodes',
        data: {
          id: selectedDevice,
          label: selectedDevice.toUpperCase()
        }
      }

      if (cy.$('node:selected').length > 0) {
        let existing = cy.$('node:selected')[0]
        // Position the new node near one of the selected nodes
        // TODO can we do overlap avoidance?
        newNode.position = {
          x: existing.position('x') + 100,
          y: existing.position('y')
        }
      }

      // Add the new node
      added = added.concat(
        cy.add(newNode)
      )

      // Add an edge between all selected nodes and the new node
      cy.$('node:selected').forEach(s => {
        var newEdgeId = `edge-${s.id()}-${selectedDevice}`
        if (cy.$id(newEdgeId).length === 0) {
          console.log("Adding new edge " + newEdgeId)
          let edge = { group: 'edges', data: { id: newEdgeId, source: s.id(), target: selectedDevice } }
          added = added.concat( cy.add(edge) )
        }
      })

      if (added.length > 0) {
        // If we added anything, update stuff
        // writeNodeSelect()
        // cy.fit()
      }
    })

    document.querySelector('#nbp-save').addEventListener('click', () => {
      saveState()
    })

    // document.querySelector('#nbp-revert').addEventListener('click', () => {
    //   cy.destroy()
    // })

    document.querySelector('#nbp-fit').addEventListener('click', () => {
      cy.fit()
    })

    // document.querySelector('#nbp-node-select').addEventListener('change', event => {
    //   cy.$('').unselect() // deselect everything else
    //   cy.$('#' + event.target.value).select()
    // })

    document.querySelector('#nbp-delete-selected').addEventListener('click', () => {
      deleteSelectedNodes()
    })

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

    document.addEventListener('keydown', event => {
      switch (event.code) {
        case 'Backspace':
        case 'Delete':
          deleteSelectedNodes()
        default:
          return
      }
    })
  })
})