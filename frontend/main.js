import './style.css'
import cytoscape from 'cytoscape';

var path, cy

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#nbp-container').innerHTML = `
    <div>
      <div class="card">
        <select id="nbp-node-select"></select>
        <button id="nbp-add-node" type="button">Add after selected</button>
        <button id="nbp-delete-selected" type="button">Delete selected</button>
        <button id="nbp-link-selected" type="button">Link selected</button>
        <button id="nbp-save" type="button">Save</button>
        <button id="nbp-reset" type="button">Reset</button>
        <button id="nbp-fit" type="button">Fit</button>
      </div>
      <div id="nbp-cy"></div>
      <div id="nbp-inspector"></div>
    </div>
  `

  const writeNodeSelect = () => {
    var nodeSelect = emptyNodeSelect()
    cy.nodes().forEach(ele => {
      var opt = document.createElement('option')
      opt.innerHTML = ele.data('label')
      opt.setAttribute('value', ele.id())
      nodeSelect.appendChild(opt)
    })
  }

  const writeInspector = (ele) => {
    var insp = document.getElementById('nbp-inspector')
    insp.innerHTML = JSON.stringify(ele.data())
  }

  const saveState = () => {
    fetch('http://localhost:8000/api/plugins/netbox-path/paths/1/', {
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
    .then((json) => console.log(json));
  }

  const emptyNodeSelect = () => {
    var ele = document.getElementById('nbp-node-select')
    ele.innerHTML = ''
    return ele
  }

  const deleteSelectedNodes = () => {
    var removed = cy.$(':selected').remove()
    writeNodeSelect()
    if (removed.length > 0) {
      cy.fit()
    }
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
      writeNodeSelect()
    })

    cy.on('select', 'node', function(evt) {
      var node = evt.target;
      document.getElementById('nbp-node-select').value = node.id()
      // console.log( 'Selected ' + node.id() )
      // node.addClass('has-been-selected')
    })

    cy.on('tap', function(evt) {
      var ele = evt.target;
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
  var fetchPath = fetch('http://localhost:8000/api/plugins/netbox-path/paths/1/').then(obj => obj.json())

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
        writeNodeSelect()
        cy.fit()
      }
    })

    document.querySelector('#nbp-save').addEventListener('click', () => {
      saveState()
    })

    document.querySelector('#nbp-reset').addEventListener('click', () => {
      cy.destroy()
    })

    document.querySelector('#nbp-fit').addEventListener('click', () => {
      cy.fit()
    })

    document.querySelector('#nbp-node-select').addEventListener('change', (event) => {
      cy.$('').unselect() // deselect everything else
      cy.$('#' + event.target.value).select()
    })

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