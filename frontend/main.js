import './style.css'
import cytoscape from 'cytoscape';

var elements,
    style,
    cy,
    cnt = 0

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#app').innerHTML = `
    <div>
      <div class="card">
        <select id="node-select"></select>
        <button id="add-node" type="button">Add after selected</button>
        <button id="delete-selected" type="button">Delete selected</button>
        <button id="link-selected" type="button">Link selected</button>
        <button id="save" type="button">Save</button>
        <button id="reset" type="button">Reset</button>
        <button id="fit" type="button">Fit</button>
      </div>
      <div id="cy"></div>
      <div id="inspector"></div>
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
    var insp = document.getElementById('inspector')
    insp.innerHTML = JSON.stringify(ele.data())
  }

  const saveState = () => {
    window.localStorage.setItem('netbox-path', JSON.stringify(cy.json()))
  }

  const emptyNodeSelect = () => {
    var ele = document.getElementById('node-select')
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

  const initCytoscape = (elements) => {
    cy = cytoscape({
      container: document.getElementById('cy'),
      layout: {
        name: 'grid'
      },
      elements: elements,
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

    // Restore local state
    var savedState = window.localStorage.getItem('netbox-path')
    try {
      savedState = JSON.parse(savedState)
      if (savedState) {
        cy.json(savedState)
      }
    } catch(err) {
      console.error(err)
      savedState = null
    }
    
    cy.ready(() => {
      writeNodeSelect()
    })

    cy.on('select', 'node', function(evt) {
      // var node = evt.target;
      // document.getElementById('node-select').value = node.id()
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
      initCytoscape(elements)
    })
  }

  // Fetch starter elements then initialise Cytoscape
  var graphP = fetch('elements.json').then(obj => obj.json())

  Promise.all([ graphP ]).then(promises => {
    elements = promises[0]
    initCytoscape(elements)

    document.querySelector('#add-node').addEventListener('click', () => {
      var added = []

      ++cnt
      var fakeNode = 'c'+cnt

      var newNode = {
        group: 'nodes',
        data: {
          id: fakeNode,
          label: fakeNode.toUpperCase()
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
        var newEdgeId = `edge-${s.id()}-${fakeNode}`
        if (cy.$id(newEdgeId).length === 0) {
          console.log("Adding new edge " + newEdgeId)
          let edge = { group: 'edges', data: { id: newEdgeId, source: s.id(), target: fakeNode } }
          added = added.concat( cy.add(edge) )
        }
      })

      if (added.length > 0) {
        // If we added anything, update stuff
        writeNodeSelect()
        cy.fit()
      }
    })

    document.querySelector('#save').addEventListener('click', () => {
      saveState()
    })

    document.querySelector('#reset').addEventListener('click', () => {
      cy.destroy()
    })

    document.querySelector('#fit').addEventListener('click', () => {
      cy.fit()
    })

    document.querySelector('#node-select').addEventListener('change', (event) => {
      cy.$('').unselect() // deselect everything else
      cy.$('#' + event.target.value).select()
    })

    document.querySelector('#delete-selected').addEventListener('click', () => {
      deleteSelectedNodes()
    })

    document.querySelector('#link-selected').addEventListener('click', () => {
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