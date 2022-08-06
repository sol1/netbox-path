import './style.css'
import { setupCounter } from './counter.js'
import cytoscape from 'cytoscape';

/**
 * TODO
 * - Persist state in localStorage (eventually server)
 * - Ability to add a new node to the graph from an external element
 * - Ability to select an existing node and add a new downstream node with an edge
 * - Ability to click on a node and delete it, deleting all dependent edges
 * - Ability to click on a node and add an edge to another existing node
 */

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

var toJson = function(obj) { return obj.json() }
var toText = function(obj) { return obj.text() }

// Fetch starter elements then initialise Cytoscape
var graphP = fetch('elements.json').then(toJson);
var styleP = fetch('style.cycss').then(toText);

Promise.all([ graphP, styleP ]).then((then) => {
  var elements = then[0];
  var style = then[1];

  var cy = cytoscape({
    container: document.getElementById('cy'),
    layout: {
      name: 'grid'
    },
    elements: elements,
    style: style
  })
  
  cy.on('select', 'node', function(evt) {
    var node = evt.target;
    console.log( 'selected ' + node.id() );
    node.addClass('has-been-selected')
  })

  cy.on('unselect', 'node', function(evt) {
    var node = evt.target;
    console.log( 'unselected ' + node.id() );
  })

  document.querySelector('#add-c').addEventListener('click', () => {
    cy.add([
      { group: 'nodes', data: { id: 'c', label: 'C' } },
      { group: 'edges', data: { id: 'ac', source: 'a', target: 'c' } },
      { group: 'edges', data: { id: 'bd', source: 'b', target: 'd' } },
      { group: 'edges', data: { id: 'db', source: 'd', target: 'b' } },
    ])
    cy.fit()
  })
})
