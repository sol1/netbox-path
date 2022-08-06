import './style.css'
import { setupCounter } from './counter.js'
import cytoscape from 'cytoscape';

document.querySelector('#app').innerHTML = `
  <div>
    <div class="card">
      <button id="counter" type="button"></button>
      <button id="add-c" type="button">Add C</button>
    </div>
    <div id="cy"></div>
  </div>
`

setupCounter(document.querySelector('#counter'))
addNode(document.querySelector('#add-c'))

export function addNode(element) {
  element.addEventListener('click', () => {
    cy.add([
      { group: 'nodes', data: { id: 'c', label: 'C' } },
      { group: 'edges', data: { id: 'ac', source: 'a', target: 'c' } },
    ])
    cy.fit()
  })
}

var cy = cytoscape({
  container: document.getElementById('cy'),

  elements: [ // list of graph elements to start with
    { // node a
      data: {
        id: 'a',
        label: 'A'
      }
    },
    { // node b
      data: {
        id: 'b',
        label: 'B'
      }
    },
    { // node b
      data: {
        id: 'd',
        label: 'D'
      }
    },
    { // edge ab
      data: { id: 'ab', source: 'a', target: 'b' }
    }
  ],

  style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(label)'
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ]
});

cy.layout({
  name: 'grid',
  fit: true
})

cy.on('tap', 'node', function(evt) {
  var node = evt.target;
  console.log( 'tapped ' + node.id() );
  node.style({
    'background-color': 'blue'
  })
});