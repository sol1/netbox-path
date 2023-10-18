import './style.css'
import './sprite.svg'
import "cytoscape-navigator/cytoscape.js-navigator.css";

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

import cytoscape from 'cytoscape';
import popper from 'cytoscape-popper';
import navigator from 'cytoscape-navigator';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import html2canvas from 'html2canvas';
import { changeFilters, selectedObject, formatKey } from './selector.js';

var path, cy, authToken, currUser
var locked = false;
var symbols = []
var tippyDict = {}
var savedData = {}

var modalOpen = false;

document.addEventListener('DOMContentLoaded', () => {
  cytoscape.use(popper);
  navigator(cytoscape);
  nodeHtmlLabel(cytoscape);
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

  fetch('/static/netbox_path/sprite.svg')
    .then(response => response.text())
    .then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      symbols = svgDoc.querySelectorAll('symbol');

      // Initialize the object select box

      changeFilters();

      const writeInspector = (ele) => {
        var insp = document.getElementById('nbp-inspector')
        insp.value = JSON.stringify(ele.data(), null, 2)
      }

      const saveState = () => {
        var graphData = cy.json();

        fetch(`/api/plugins/netbox-path/paths/${netboxPathId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            graph: graphData,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${authToken}`,
          },
          credentials: 'omit'
        })
          .then((response) => response.json())
          .then((json) => {
            console.log('Saved', json)
            savedData = cy.json()['elements']
          });
      }

      const deleteSelectedNodes = () => {
        if (!modalOpen) {
          var removed = cy.$(':selected').remove()
        }
      }

      // Change what buttons are active based on the selected node
      const toggleButtons = selected => {
        var numSelected = selected.length

        if (locked) {
          document.getElementById('nbp-lock').disabled = true;
          document.getElementById('nbp-unlock').disabled = false;
          document.getElementById('nbp-add-node').disabled = true;
          document.getElementById('nbp-save').disabled = true;
        } else {
          document.getElementById('nbp-lock').disabled = false;
          document.getElementById('nbp-unlock').disabled = true;
          document.getElementById('nbp-add-node').disabled = false;
          document.getElementById('nbp-save').disabled = false;
        }

        if (numSelected > 0) {
          // Some stuff is selected. Activate action buttons
          document.getElementById('nbp-delete-selected').disabled = false
          document.getElementById('nbp-edit-selected').disabled = false
          document.getElementById('nbp-change-icon-selected').disabled = false;

          if (cy.$(':selected').length > 1) {
            document.getElementById('nbp-link-selected').disabled = false
            document.getElementById('nbp-edit-selected').disabled = true
            document.getElementById('nbp-change-icon-selected').disabled = true;
          } else {
            document.getElementById('nbp-link-selected').disabled = true
          }
        } else {
          // Nothing selected - disable action buttons
          document.getElementById('nbp-delete-selected').disabled = true
          document.getElementById('nbp-link-selected').disabled = true
          document.getElementById('nbp-edit-selected').disabled = true
          document.getElementById('nbp-change-icon-selected').disabled = true;
        }
      }

      function groupEdges() {
        const groups = {};

        cy.edges().forEach(edge => {
          const color = edge.data('color');
          const label = edge.data('label');
          const style = edge.data('style');

          let groupKey = `${label}-${color}-${style}`;
          if (groupKey == `-#999999-solid`) {
            groupKey = 'default';
          }

          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }

          let group = {
            color: color,
            label: label,
            style: style,
          }

          groups[groupKey] = group;
        });

        return groups;
      }

      const updateAddDropdown = () => {
        var dropdownMenu = document.getElementById('edge-group-dropdown-menu');
        dropdownMenu.innerHTML = '';

        const groups = groupEdges();

        Object.entries(groups).forEach(([k, v]) => {
          var listItem = document.createElement('li');


          var dropdownItem = document.createElement('a');
          dropdownItem.className = 'dropdown-item';
          dropdownItem.innerText = k;

          dropdownItem.onclick = () => {
            addNode(k);
          }

          listItem.appendChild(dropdownItem);
          dropdownMenu.appendChild(listItem);
        });
      }

      // Change button text based on the selected node
      const labelButtons = selected => {
        var numSelected = selected.length

        if (numSelected > 1) {
          document.getElementById('nbp-add-node').innerHTML = `Add and link to ${numSelected} nodes`
          updateAddDropdown();
          document.getElementById('nbp-add-node-dropdown').disabled = false;
          document.getElementById('nbp-delete-selected').innerHTML = `<span class="mdi mdi-trash-can-outline"></span> Delete ${numSelected} nodes`
          document.getElementById('nbp-edit-selected').innerHTML = `<span class="mdi mdi-pencil"></span> Edit`

          if (cy.$('node:selected').length > 1) {
            // The link button is only concerned with nodes as opposed to edges
            document.getElementById('nbp-link-selected').innerHTML = `Link ${numSelected} nodes`
          }

        } else if (numSelected === 1 && selected[0].group() == 'nodes') {
          document.getElementById('nbp-edit-selected').innerHTML = `<span class="mdi mdi-pencil"></span> Edit Node`
          document.getElementById('nbp-add-node').innerHTML = `Add and link to ${selected[0].data().object.name}`
          updateAddDropdown();
          document.getElementById('nbp-add-node-dropdown').disabled = false;
          document.getElementById('nbp-delete-selected').innerHTML = `<span class="mdi mdi-trash-can-outline"></span> Delete`
          document.getElementById('nbp-link-selected').innerHTML = 'Link'
        } else if (numSelected === 1 && selected[0].group() == 'edges') {
          document.getElementById('nbp-edit-selected').innerHTML = `<span class="mdi mdi-pencil"></span> Edit Edge`
        } else {
          // Nothing selected
          document.getElementById('nbp-edit-selected').innerHTML = `<span class="mdi mdi-pencil"></span> Edit`
          document.getElementById('nbp-add-node').innerHTML = 'Add'
          document.getElementById('nbp-add-node-dropdown').disabled = true;
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

      let makePopper = node => {
        let popoverData = ``;
        for (var key in node.data('object')) {
          if (node.data('object').hasOwnProperty(key)) {
            popoverData += `${key}: ${node.data('object')[key]}</br>`
          }
        }
        let url = node.data('object')['url'].replace("/api/", "/");;
        popoverData += `</br><div class='d-grid'><button class='btn btn-primary btn-sm' onclick='window.open("${url}", "_blank")'>View in Netbox</button></div>`
        let ref = node.popperRef();
        let dummyDomEle = document.createElement("div");

        let tip = tippy(dummyDomEle, {
          getReferenceClientRect: ref.getBoundingClientRect,
          trigger: "manual",

          content: () => {
            let content = document.createElement("div");
            content.innerHTML = popoverData;
            return content;
          },

          interactive: true,
          interactiveBorder: 100,
          interactiveDebounce: 1000,
          duration: [500, 1000],
          offset: [0, 0],
          appendTo: document.body,
        });
        tippyDict[node.id()] = tip;

        cy.nodes().unbind("mouseover");
        cy.nodes().bind("mouseover", event => {
          tippyDict[event.target.id()].show();
        });

        cy.nodes().unbind("mouseout");
        cy.nodes().bind("mouseout", event => {
          tippyDict[event.target.id()].hide();
        });
      };

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
                'background-color': 'black',
                //'label': 'data(label)',
                'width': '40',
                'height': '40',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-wrap': 'wrap',
                "font-size": "10px",
                'color': '#fff',
              }
            },
            {
              selector: 'edge',
              style: {
                'width': '4',
                'line-color': 'data(color)',
                'target-arrow-color': 'data(color)',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'line-style': 'data(style)',
                'label': 'data(label)',
                'font-size': '10px',
                'edge-text-rotation': 'autorotate',
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
          savedData = cy.json()['elements']
        }

        cy.ready(() => {
          // Simplify starting point by unselecting everything
          cy.$('').unselect()

          cy.autoungrabify(true);
          cy.autounselectify(true);
          locked = true;

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
          console.log(ele);
          writeInspector(ele)
        })

        // If user clicks the destroy button, wipe local state and re-init from server data
        cy.on('destroy', () => {
          localStorage.removeItem('netbox-path')
          initCytoscape(path?.graph)
        })

        cy.nodeHtmlLabel(
          [
            {
              query: "node",
              tpl: function (data) {
                return `
                  <div class="node">
                    <span class="node-icon rounded-circle">
                      <svg height="30" width="30" viewbox="0 0 18 18">${Array.from(symbols).filter(function (element) { return element.getAttribute('id') == data.icon; })[0].innerHTML}</svg>
                    </span>
                    <span class="node-label">${data.label}</span>
                  </div>
              `
              },
            },
            {
              query: "node:selected",
              tpl: function (data) {
                return `
                  <div class="node">
                    <span class="node-icon rounded-circle node-selected">
                      <svg height="30" width="30" viewbox="0 0 18 18">${Array.from(symbols).filter(function (element) { return element.getAttribute('id') == data.icon; })[0].innerHTML}</svg>
                    </span>
                    <span class="node-label">${data.label}</span>
                  </div>
              `
              },
            },
          ],
          {
            enablePointerEvents: true
          }
        );

        cy.ready(function () {
          cy.nodes().forEach(node => {
            makePopper(cy.getElementById(node.data('id')));
          });
        });

        var defaults = {
          container: '#nbp-navigator',
          viewLiveFramerate: 0,
          thumbnailEventFramerate: 30,
          thumbnailLiveFramerate: false,
          dblClickDelay: 200,
          removeCustomContainer: false,
          rerenderDelay: 100
        };

        var nav = cy.navigator(defaults);
        cy.fit();
      }

      // Fetch data from server and initialise Cytoscape
      // var graphP = fetch(netboxPathDataUrl).then(obj => obj.json())
      var fetchPath = fetch(`/api/plugins/netbox-path/paths/${netboxPathId}/`).then(obj => obj.json())

      /*
      * Default icons for nodes
      */
      function chooseIcon(type) {
        switch (type) {
          case 'dcim.devices':
            return '10855-icon-service-module';
          case 'dcim.interfaces':
            return '10854-icon-service-media';
          case 'virtualization.interfaces':
            return '10245-icon-service-key-vaults';
          case 'circuits.circuits':
            return '10079-icon-service-expressroute-circuits';
          case 'ipam.vlans':
            return '10853-icon-service-backlog';
          case 'dcim.racks':
            return '10852-icon-service-workflow';
          case 'dcim.regions':
            return '10851-icon-service-workbooks';
          case 'dcim.sites':
            return '10850-icon-service-web-test';
          case 'tenancy.tenants':
            return '10849-icon-service-web-slots';
          case 'virtualization.virtual-machines':
            return '10848-icon-service-website-staging';
        }
      }

      function addNode(groupName) {
        let group = groupEdges()[groupName];

        if (group === undefined) {
          group = {
            color: '#999999',
            label: '',
            style: 'solid',
          }
        }

        if (selectedObject === undefined) {
          return;
        }
        var added = []

        // Get the selected value from netbox-object-type-select
        var selectedObjectType = document.getElementById('netbox-object-type-select')
        var objectUrl = selectedObjectType.options[selectedObjectType.selectedIndex].getAttribute('value')
        var fetchData = fetch(`/api/${objectUrl}/${selectedObject}/`).then((response) => response.json())

        // Set the label of the device select to the name of the selected object type
        var objectType = objectUrl.split('/')[1]
        var objectTypeLabel = formatKey(objectType);

        // Drop the s from the end of the object type name
        //if (objectTypeLabel.endsWith('s')) {
        //  objectTypeLabel = objectTypeLabel.slice(0, -1)
        //}
        objectTypeLabel = objectUrl.replaceAll('/', '.');

        Promise.all([fetchData]).then(promises => {
          var deviceData = promises[0]

          // Generate a random id for the new node
          var id = Math.random().toString(36).substring(7)

          // Create the new node
          var newNode = {
            data: {
              id: id,
              label: deviceData.display,
              icon: chooseIcon(objectTypeLabel),
              object: {
                id: deviceData.id,
                type: objectTypeLabel,
                url: deviceData.url,
                display: deviceData.display,
                name: deviceData.name,
              },
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

          makePopper(cy.getElementById(id));

          // Add an edge between all selected nodes and the new node
          cy.$('node:selected').forEach(s => {
            var newEdgeId = `edge-${s.id()}-${id}`
            if (cy.$id(newEdgeId).length === 0) {
              console.log("Adding new edge " + newEdgeId)
              let edge = { data: { id: newEdgeId, source: s.id(), target: id, label: group.label, style: group.style, color: group.color } }
              added = added.concat(cy.add(edge))
            }
          })

          if (added.length > 0) {

            // If we added anything, update stuff
            // writeNodeSelect()
            cy.fit()
          }
        })
      }

      Promise.all([fetchPath]).then(promises => {
        path = promises[0]
        initCytoscape(path.graph)

        document.querySelector('#nbp-add-node').addEventListener('click', () => {
          addNode('default');
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

        // TODO: Add dropdown for link button

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
                let edge = { data: { id: newEdgeId, source: a.id(), target: b.id(), label: '', style: 'solid', color: '#999999' } }
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

        document.addEventListener('hidden.bs.modal', event => {
          modalOpen = false;
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

        var selectedIcon = '';

        // Check if the change icon button is pressed
        document.getElementById('nbp-change-icon-selected').addEventListener('click', () => {
          var selected = cy.elements(':selected');
          if (selected.length === 0) {
            return
          }
          var obj = selected[0]
          selectedIcon = obj.data('icon');
          modalOpen = true;

          if (obj.group() == 'nodes') {
            var modalNodeAttributesSection = document.getElementById('node-icons-to-show')
            modalNodeAttributesSection.innerHTML = ''

            var searchBar = document.getElementById('nbp-node-icon-search');
            searchBar.value = '';

            function renderIcons() {
              modalNodeAttributesSection.innerHTML = '';
              Array.from(symbols).filter(function (element) { return element.getAttribute('id').includes(searchBar.value); }).forEach((symbol) => {
                var svgId = symbol.getAttribute('id');

                var svgDiv = document.createElement('div');
                svgDiv.className = 'col-3 col-md-2';
                svgDiv.id = `node-icon-${svgId}`;

                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

                if (svgId === selectedIcon) {
                  svg.classList.add('border');
                  svg.classList.add('border-black');
                  svg.classList.add('rounded');
                }

                svg.onclick = () => {
                  modalNodeAttributesSection.childNodes.forEach((node) => {
                    node.childNodes.forEach((childNode) => {
                      childNode.classList.remove('border');
                      childNode.classList.remove('border-black');
                      childNode.classList.remove('rounded');
                    });
                  });
                  svg.classList.add('border');
                  svg.classList.add('border-black');
                  svg.classList.add('rounded');
                  selectedIcon = svgId;
                }

                svg.setAttribute('width', '30');
                svg.setAttribute('height', '30');
                svg.setAttribute('viewBox', '0 0 18 18');
                svg.innerHTML = symbol.innerHTML;

                svgDiv.appendChild(svg);
                modalNodeAttributesSection.appendChild(svgDiv);
              });
            }

            searchBar.oninput = () => {
              renderIcons();
            }

            renderIcons();
          }
        })

        document.getElementById('nbp-node-change-icon-save').addEventListener('click', () => {
          var selected = cy.elements(':selected');
          if (selected.length === 0) {
            return
          }

          var obj = selected[0]
          obj.data('icon', selectedIcon);
        })

        // Check if the edit node button is pressed
        document.getElementById('nbp-edit-selected').addEventListener('click', () => {
          // Get the selected node
          var selected = cy.elements(':selected');
          if (selected.length === 0) {
            return
          }
          modalOpen = true;
          var obj = selected[0]
          if (obj.group() == 'nodes') {
            var objectData = obj.data('object')

            var modalNodeAttributesSection = document.getElementById('node-attributes-to-show')
            modalNodeAttributesSection.innerHTML = ''

            var labelDiv = document.createElement('div');
            labelDiv.id = `node-label-input-div`;
            labelDiv.className = 'form-group col-md-12';

            var nodeLabel = document.createElement('label');
            nodeLabel.innerText = 'Label';
            nodeLabel.htmlFor = `node-label-input`;
            labelDiv.appendChild(nodeLabel);

            var labelSelect = document.createElement('select');
            labelSelect.id = `node-label-input`;
            labelSelect.className = 'form-select';

            for (var key in objectData) {
              var option = document.createElement("option");
              if (obj.data('label') === objectData[key]) {
                option.selected = true;
              }
              option.value = objectData[key];
              option.text = key;
              labelSelect.appendChild(option);
            }

            labelDiv.appendChild(labelSelect);

            var descriptionDiv = document.createElement('div');
            descriptionDiv.id = `node-description-input-div`;
            descriptionDiv.className = 'form-group col-md-12';

            var descriptionLabel = document.createElement('label');
            descriptionLabel.innerText = 'Description';
            descriptionLabel.htmlFor = `node-description-input`;
            descriptionDiv.appendChild(descriptionLabel);

            var descriptionInput = document.createElement('input');
            descriptionInput.type = 'text';
            descriptionInput.className = 'form-control';
            descriptionInput.id = `node-description-input`;
            if (obj.data('description') !== undefined) {
              descriptionInput.value = obj.data('description');
            }

            descriptionDiv.appendChild(descriptionInput);

            modalNodeAttributesSection.appendChild(labelDiv);
            modalNodeAttributesSection.appendChild(descriptionDiv);
          } else if (obj.group() == 'edges') {
            var modalNodeAttributesSection = document.getElementById('node-attributes-to-show')
            modalNodeAttributesSection.innerHTML = ''

            const groups = groupEdges();

            var groupDiv = document.createElement('div');
            groupDiv.id = `edge-group-input-div`;
            groupDiv.className = 'form-group col-md-12';

            var groupLabel = document.createElement('label');
            groupLabel.innerText = 'Group';
            groupLabel.htmlFor = `edge-group-input`;
            groupDiv.appendChild(groupLabel);

            var groupSelect = document.createElement('select');
            groupSelect.id = `edge-group-input`;
            groupSelect.className = 'form-select';

            var newOption = document.createElement("option");
            newOption.value = 'new';
            newOption.text = 'New';
            groupSelect.appendChild(newOption);

            Object.entries(groups).forEach(([k, v]) => {
              var option = document.createElement("option");
              if (obj.data('label') === v.label && obj.data('color') === v.color && obj.data('style') === v.style) {
                option.selected = true;
              }
              option.value = k;
              option.text = k;
              groupSelect.appendChild(option);
            })

            groupDiv.appendChild(groupSelect);

            var inputDiv = document.createElement('div');
            inputDiv.id = `edge-label-input-div`;
            inputDiv.className = 'form-group col-md-12';

            var label = document.createElement('label');
            label.innerText = 'Label';
            label.htmlFor = `edge-label-input`;
            inputDiv.appendChild(label);

            var input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = `edge-label-input`;
            if (obj.data('label') !== undefined) {
              input.value = obj.data('label');
            }

            inputDiv.appendChild(input);

            let options = ['solid', 'dotted', 'dashed'];

            var typeDiv = document.createElement('div');
            typeDiv.id = `edge-type-input-div`;
            typeDiv.className = 'form-group col-md-12';

            var typeLabel = document.createElement('label');
            typeLabel.innerText = 'Type';
            typeLabel.htmlFor = `edge-type-input`;
            typeDiv.appendChild(typeLabel);

            var typeSelect = document.createElement('select');
            typeSelect.id = `edge-type-input`;
            typeSelect.className = 'form-select';

            for (var i = 0; i < options.length; i++) {
              var option = document.createElement("option");
              if (obj.data('style') !== undefined && obj.data('style') === options[i]) {
                option.selected = true;
              }
              option.value = options[i];
              option.text = options[i][0].toUpperCase() + options[i].slice(1);
              typeSelect.appendChild(option);
            }

            typeDiv.appendChild(typeSelect);

            var colorDiv = document.createElement('div');
            colorDiv.id = `edge-color-input-div`;
            colorDiv.className = 'form-group col-md-12';

            var colorLabel = document.createElement('label');
            colorLabel.innerText = 'Color';
            colorLabel.htmlFor = `edge-color-input`;
            colorDiv.appendChild(colorLabel);

            var colorGroup = document.createElement('div');
            colorGroup.className = 'input-group';

            var colorGroupPrepend = document.createElement('div');
            colorGroupPrepend.className = 'input-group-prepend';

            var colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'input-group-text form-control-color';
            colorPicker.value = obj.data('color');

            var colorInput = document.createElement('input');
            colorInput.type = 'text';
            colorInput.className = 'edge-color-input form-control';
            colorInput.value = obj.data('color');
            colorInput.id = `edge-color-input`;
            colorPicker.addEventListener('input', function () {
              colorInput.value = colorPicker.value;
            });

            colorInput.addEventListener('input', function () {
              colorPicker.value = colorInput.value;
            });

            colorGroupPrepend.appendChild(colorPicker);

            colorGroup.appendChild(colorGroupPrepend);
            colorGroup.appendChild(colorInput);

            colorDiv.appendChild(colorGroup);

            if (groupSelect.value !== 'new') {
              inputDiv.hidden = true;
              typeDiv.hidden = true;
              colorDiv.hidden = true;
            }

            groupSelect.addEventListener('change', function () {
              const selectedValue = document.getElementById(`edge-group-input`).value;
              if (selectedValue === 'new') {
                inputDiv.hidden = false;
                typeDiv.hidden = false;
                colorDiv.hidden = false;
              } else {
                inputDiv.hidden = true;
                typeDiv.hidden = true;
                colorDiv.hidden = true;
                const selectedGroup = groups[selectedValue];

                input.value = selectedGroup.label;
                typeSelect.value = selectedGroup.style;
                colorPicker.value = selectedGroup.color;
                colorInput.value = selectedGroup.color;
              }
            });

            modalNodeAttributesSection.appendChild(groupDiv);
            modalNodeAttributesSection.appendChild(inputDiv);
            modalNodeAttributesSection.appendChild(typeDiv);
            modalNodeAttributesSection.appendChild(colorDiv);
          }
        })

        // Check if the modal save button is pressed
        document.getElementById('nbp-node-edit-save').addEventListener('click', () => {
          // Get the selected node
          var selected = cy.$(':selected')
          if (selected.length === 0) {
            return
          }
          var obj = selected[0]

          if (obj.group() == 'nodes') {
            // Get the values submitted from the modal
            var modalNodeAttributesSection = document.getElementById('node-attributes-to-show')
            var descriptionInput = modalNodeAttributesSection.querySelector('.form-control');
            var labelType = document.getElementById('node-label-input');

            obj.data('label', labelType.value);
            obj.data('description', descriptionInput.value);
          } else if (obj.group() == 'edges') {
            var modalNodeAttributesSection = document.getElementById('node-attributes-to-show');

            var input = modalNodeAttributesSection.querySelector('.form-control');
            var typeSelect = modalNodeAttributesSection.querySelector('#edge-type-input');
            var colorInput = modalNodeAttributesSection.querySelector('.form-control-color');
            var colorInput = modalNodeAttributesSection.querySelector('.edge-color-input');

            obj.data('style', typeSelect.value);
            obj.data('label', input.value)
            obj.data('color', colorInput.value);
          }
        })

        document.getElementById('nbp-lock').addEventListener('click', () => {
          locked = true;
          cy.autoungrabify(true);
          cy.autounselectify(true);

          toggleButtons(cy.$(':selected'));
        });

        document.getElementById('nbp-unlock').addEventListener('click', () => {
          locked = false;
          cy.autoungrabify(false);
          cy.autounselectify(false);

          toggleButtons(cy.$(':selected'));
        });

        // Get the value of the object type when the user selects it
        document.getElementById('netbox-object-type-select').addEventListener('change', function () {
          changeFilters()
        })

        document.getElementById('nbp-screenshot-selected').addEventListener('click', () => {
          var navigatorContainer = document.getElementById('nbp-navigator');
          navigatorContainer.style.display = 'none';
          html2canvas(document.getElementById('nbp-cy')).then(function (canvas) {
            var anchorTag = document.createElement("a");
            anchorTag.download = "netbox-path.jpg";
            anchorTag.href = canvas.toDataURL();
            anchorTag.target = '_blank';
            anchorTag.click();
          })
          navigatorContainer.style.display = 'block';
        })

        window.addEventListener('beforeunload', function (event) {
          if (!locked) {
            if (JSON.stringify(savedData) !== JSON.stringify(cy.json()['elements'])) {
              event.preventDefault();
              event.returnValue = '';
              return 'If you exit all unsaved data will be lost.';
            }
          }
        });
      });
    });
})