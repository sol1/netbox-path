import './main.js'
import TomSelect from 'tom-select';

var objectProperties, netboxObjectSelect, queryVal, selectedObject;
var queryUrl = '/api/dcim/devices/?limit=100'
var qureyFilters = []
var filters = []

netboxObjectSelect = new TomSelect('#netbox-object-select', {
    valueField: 'id',
    labelField: 'display',
    searchField: 'display',
    options: [],
    preload: true,
    create: false,
    load: function (query, callback) {
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
        option: function (item, escape) {
            var objectDetails = ''
            for (var key in item) {
                if (item[key] !== null && typeof item[key] === 'object' && "url" in item[key]) {
                    objectDetails += `<div class="col">${escape(formatKey(key))}: <span class="text-muted">${item[key].display}</span></div>`
                }
            }
            return `<div class="d-flex">
              <div class="mb-1">
                <p class="h5">${escape(item.display)}</p>
                <div class="container">
                  <div class="row">
                    ${objectDetails}
                  </div>
                </div>
              </div>
            </div>`;
        },
    },
    onChange: function (value) {
        updateSelectedObject(value)
    },
    onType: function (str) {
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
                load: function (query, callback) {
                    var inputId = this.inputId
                    var url = filters.filter(function (element) { return element.domId == inputId; })[0].url
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
                    option: function (item, escape) {
                        var objectDetails = ''
                        for (var key in item) {
                            if (item[key] !== null && typeof item[key] === 'object' && "url" in item[key]) {
                                objectDetails += `<div class="col">${escape(formatKey(key))}: <span class="text-muted">${item[key].display}</span></div>`
                            }
                        }
                        return `<div class="d-flex">
                    <div class="mb-1">
                      <p class="h5">${escape(item.display)}</p>
                      <div class="container">
                        <div class="row">
                          ${objectDetails}
                        </div>
                      </div>
                    </div>
                  </div>`;
                    },
                },
                onChange: function (e) {
                    var inputId = this.inputId
                    var key = filters.filter(function (element) { return element.domId == inputId; })[0].key
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

export { selectedObject, changeFilters, formatKey }