const token = document.getElementById("token").value;
const userId = document.getElementById("userId").value;

console.log("Initializing - Token:", token);
console.log("Initializing - UserID:", userId);

let isLocked = false;
let lastValues = new Map(); // Track last known values before changes
let sortDirection = new Map(); // Track sort direction for each type

// Session Storage Helpers
function saveToSessionStorage(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
}


function loadFromSessionStorage(key) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

async function fetchWithAuth(url, method = 'GET', body = null) {
    console.log(`Fetching URL: ${url} with method: ${method}`);
    const options = {
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
        console.log("Request body:", body);
    }
    try {
        const response = await fetch(url, options);
        console.log(`Response status for ${url}: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Response data for ${url}:`, data);
        return data;
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
}

async function fetchTableManagerListItems(itemType, itemId) {
    const url = `/api/tablemanager/list?itemType=${itemType}${itemId !== null ? `&itemId=${itemId}` : ''}`;
    console.log(`Fetching list items - Type: ${itemType}, ID: ${itemId}`);
    const cachedData = loadFromSessionStorage(`${itemType}_list_${itemId || 'all'}`);
    if (cachedData) return cachedData;
    const data = await fetchWithAuth(url);
    saveToSessionStorage(`${itemType}_list_${itemId || 'all'}`, data);
    return data;
}

async function fetchTableManagerItem(itemType, itemId) {
    const url = `/api/tablemanager/item?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Fetching item - Type: ${itemType}, ID: ${itemId}`);
    const cachedData = loadFromSessionStorage(`${itemType}_${itemId}`);
    if (cachedData) return cachedData;
    const data = await fetchWithAuth(url);
    saveToSessionStorage(`${itemType}_${itemId}`, data);
    return data;
}

async function setTableManagerItem(itemType, itemId, item) {
    const url = `/api/tablemanager/set?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Setting item - Type: ${itemType}, ID: ${itemId}`);
    const data = await fetchWithAuth(url, 'POST', item);
    saveToSessionStorage(`${itemType}_${itemId}`, item);
    return data;
}

function toggleLockControls() {
    const inputs = document.querySelectorAll('input:not([type="hidden"])');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selects = document.querySelectorAll('select');
    const buttons = document.querySelectorAll('button:not(#cancelLogout)');
    const textareas = document.querySelectorAll('textarea');
    const lockIcon = document.querySelector('img[src="/assets/Icons/lock.svg"]');

    if (!isLocked) {
        updateLastValues();
        inputs.forEach(input => input.disabled = true);
        checkboxes.forEach(checkbox => checkbox.disabled = true);
        selects.forEach(select => select.disabled = true);
        buttons.forEach(button => button.disabled = true);
        textareas.forEach(textarea => textarea.disabled = true);

        if (lockIcon) {
            lockIcon.style.opacity = '1';
            lockIcon.style.filter = 'brightness(0) invert(1) hue-rotate(180deg)';
        }

        isLocked = true;
    } else {
        inputs.forEach(input => input.disabled = false);
        checkboxes.forEach(checkbox => checkbox.disabled = false);
        selects.forEach(select => select.disabled = false);
        buttons.forEach(button => button.disabled = false);
        textareas.forEach(textarea => textarea.disabled = false);

        if (lockIcon) {
            lockIcon.style.opacity = '0.7';
            lockIcon.style.filter = 'brightness(0) invert(1)';
        }

        applyVisibilityRules();
        isLocked = false;
    }
}

function applyVisibilityRules() {
    document.querySelectorAll('.custom-list-item').forEach(item => {
        const itemId = item.dataset.id;
        const list = item.closest('ul');
        const itemType = list.id.replace('List', '');
        const data = loadFromSessionStorage(`${itemType}_${itemId}`);
        item.style.display = (data && !data.visible) ? 'none' : 'block';

        if (itemType === 'Field' && data && !data.visible) {
            const fieldDetails = document.querySelector('.field-settings');
            if (fieldDetails) {
                const dataTypeInput = fieldDetails.querySelector(`input[value="${data.dataType}"]`);
                const subTypeInput = fieldDetails.querySelector(`input[value="${data.dataSubType}"]`);
                if (dataTypeInput) dataTypeInput.style.display = 'none';
                if (subTypeInput) subTypeInput.style.display = 'none';
            }
        }
    });
}

function updateLastValues() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"])');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const textareas = document.querySelectorAll('textarea');

    inputs.forEach(input => {
        const key = input.id || input.name || `input_${Math.random().toString(36).substr(2, 9)}`;
        lastValues.set(key, input.value);
    });

    checkboxes.forEach(checkbox => {
        const key = checkbox.id || checkbox.name || `checkbox_${Math.random().toString(36).substr(2, 9)}`;
        lastValues.set(key, checkbox.checked);
    });

    textareas.forEach(textarea => {
        const key = textarea.id || textarea.name || `textarea_${Math.random().toString(36).substr(2, 9)}`;
        lastValues.set(key, textarea.value);
    });
}

function undoChanges() {
    if (!isLocked) {
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"])');
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        const textareas = document.querySelectorAll('textarea');

        inputs.forEach(input => {
            const key = input.id || input.name || `input_${Math.random().toString(36).substr(2, 9)}`;
            const lastValue = lastValues.get(key);
            if (lastValue !== undefined && input.value !== lastValue) {
                input.value = lastValue;
            }
        });

        checkboxes.forEach(checkbox => {
            const key = checkbox.id || checkbox.name || `checkbox_${Math.random().toString(36).substr(2, 9)}`;
            const lastChecked = lastValues.get(key);
            if (lastChecked !== undefined && checkbox.checked !== lastChecked) {
                checkbox.checked = lastChecked;
            }
        });

        textareas.forEach(textarea => {
            const key = textarea.id || textarea.name || `textarea_${Math.random().toString(36).substr(2, 9)}`;
            const lastValue = lastValues.get(key);
            if (lastValue !== undefined && textarea.value !== lastValue) {
                textarea.value = lastValue;
            }
        });

        console.log("Undone recent changes");
        applyVisibilityRules();
    }
}

async function populateAreasList() {
    console.log("Populating areas list");
    const listBox = document.querySelector("#areaList");
    if (!listBox) {
        console.error("Area list element not found");
        return;
    }
    listBox.innerHTML = '<li class="custom-list-item">Loading...</li>';

    try {
        const areas = await fetchTableManagerListItems("Area", null);
        console.log("Areas received:", areas);
        listBox.innerHTML = areas.map(area => `
            <li class="custom-list-item" data-id="${area.id}" style="display: ${area.visible ? 'block' : 'none'}">${area.name}</li>
        `).join("");

        attachAreaListListeners();

        const areaIconBar = document.querySelector(".table-manager .icon-bar");
        if (!areaIconBar) {
            console.error("Area icon bar not found");
            return;
        }
        console.log("Adding event listeners to area icon bar");
        areaIconBar.children[0].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort alphabetically clicked for Areas (up)");
                sortDirection.set("Area", "up");
                await sortItemsAlphabetically("Area");
            }
        });
        areaIconBar.children[1].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort alphabetically clicked for Areas (down)");
                sortDirection.set("Area", "down");
                await sortItemsAlphabetically("Area");
            }
        });
        areaIconBar.children[2].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Add clicked for Areas - adding typeable item");
                await addTypeableAreaItem();
            }
        });
        areaIconBar.children[3].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Delete clicked for Areas");
                await deleteItem("Area");
            }
        });
    } catch (error) {
        console.error("Error in populateAreasList:", error);
        listBox.innerHTML = '<li class="custom-list-item error">Failed to load Areas</li>';
    }
}

async function addTypeableAreaItem() {
    console.log("Adding typeable area item");
    const list = document.getElementById("areaList");
    if (!list) {
        console.error("Area list not found");
        return;
    }

    let newId;
    try {
        const areas = await fetchTableManagerListItems("Area", null);
        newId = Math.max(...areas.map(i => i.id), 0) + 1;
    } catch (error) {
        console.error("Failed to fetch areas for ID generation, using fallback ID:", error);
        newId = Date.now();
    }

    const newItem = document.createElement("li");
    newItem.classList.add("custom-list-item");
    newItem.dataset.id = newId;
    newItem.innerHTML = `<input type="text" id="newAreaName_${newId}" value="Area ${newId}" style="width: 100%; box-sizing: border-box;">`;

    if (list.children.length === 1 && list.children[0].textContent === "No items") {
        list.innerHTML = "";
    }
    list.appendChild(newItem);

    const input = newItem.querySelector(`#newAreaName_${newId}`);
    input.focus();

    const saveAndLoadAllDivs = async () => {
        const name = input.value.trim() || `Area ${newId}`;
        newItem.textContent = name;
        newItem.classList.add("selected");

        document.querySelectorAll("#areaList .custom-list-item").forEach(i => {
            if (i !== newItem) i.classList.remove("selected");
        });

        console.log(`Saving new area with name: ${name}, ID: ${newId}`);

        try {
            const newArea = {
                id: newId,
                name: name,
                description: "",
                visible: true,
                readOnly: false,
                reserved: false,
                icon: null
            };
            await setTableManagerItem("Area", newId, newArea);
            saveToSessionStorage(`Area_${newId}`, newArea);
            console.log(`New area saved successfully: ${name}, ID: ${newId}`);
        } catch (error) {
            console.error("Failed to save new area:", error);
            newItem.textContent += " (Save Failed)";
            return;
        }

        attachAreaListListeners();
        await loadAreaDetails(newId);
        await loadEmptyTableDetails(newId);
        await loadEmptyFieldGroupDetails(null);
        await loadEmptyFieldDetails(null);
    };

    input.addEventListener("blur", saveAndLoadAllDivs);
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            await saveAndLoadAllDivs();
        }
    });
}
async function addTypeableTableItem(areaId) {
    console.log(`Adding typeable table item for Area ID: ${areaId}`);
    const list = document.getElementById("tableList");
    if (!list) {
        console.error("Table list not found");
        return;
    }

    let newId;
    try {
        const tables = await fetchTableManagerListItems("Table", areaId);
        newId = Math.max(...tables.map(i => i.id), 0) + 1;
    } catch (error) {
        console.error("Failed to fetch tables for ID generation, using fallback ID:", error);
        newId = Date.now();
    }

    const newItem = document.createElement("li");
    newItem.classList.add("custom-list-item");
    newItem.dataset.id = newId;
    newItem.innerHTML = `<input type="text" id="newTableName_${newId}" value="Table ${newId}" style="width: 100%; box-sizing: border-box;">`;

    if (list.children.length === 1 && list.children[0].textContent === "No items") {
        list.innerHTML = "";
    }
    list.appendChild(newItem);

    const input = newItem.querySelector(`#newTableName_${newId}`);
    input.focus();

    const saveNewTable = async () => {
        const name = input.value.trim() || `Table ${newId}`;
        newItem.textContent = name;
        newItem.classList.add("selected");

        document.querySelectorAll("#tableList .custom-list-item").forEach(i => {
            if (i !== newItem) i.classList.remove("selected");
        });

        console.log(`Saving new table with name: ${name}, ID: ${newId}, Area ID: ${areaId}`);

        try {
            const newTable = {
                id: newId,
                name: name,
                description: "",
                visible: true,
                readOnly: false,
                reserved: false,
                icon: null,
                areaId: areaId
            };
            await setTableManagerItem("Table", newId, newTable);
            saveToSessionStorage(`Table_${newId}`, newTable);
            console.log(`New table saved successfully: ${name}, ID: ${newId}`);
        } catch (error) {
            console.error("Failed to save new table:", error);
            newItem.textContent += " (Save Failed)";
            return;
        }

        attachTableListListeners();
        await loadTableDetails(newId);
        await loadEmptyFieldGroupDetails(newId);
        await loadEmptyFieldDetails(null);
    };

    input.addEventListener("blur", saveNewTable);
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            await saveNewTable();
        }
    });
}
async function addTypeableFieldGroupItem(tableId) {
    console.log(`Adding typeable field group item for Table ID: ${tableId}`);
    const list = document.getElementById("fieldGroupList");
    if (!list) {
        console.error("Field group list not found");
        return;
    }

    let newId;
    try {
        const fieldGroups = await fetchTableManagerListItems("FieldGroup", tableId);
        newId = Math.max(...fieldGroups.map(i => i.id), 0) + 1;
    } catch (error) {
        console.error("Failed to fetch field groups for ID generation, using fallback ID:", error);
        newId = Date.now();
    }

    const newItem = document.createElement("li");
    newItem.classList.add("custom-list-item");
    newItem.dataset.id = newId;
    newItem.innerHTML = `<input type="text" id="newFGName_${newId}" value="Field Group ${newId}" style="width: 100%; box-sizing: border-box;">`;

    if (list.children.length === 1 && list.children[0].textContent === "No items") {
        list.innerHTML = "";
    }
    list.appendChild(newItem);

    const input = newItem.querySelector(`#newFGName_${newId}`);
    input.focus();

    const saveNewFG = async () => {
        const name = input.value.trim() || `Field Group ${newId}`;
        newItem.textContent = name;
        newItem.classList.add("selected");

        document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(i => {
            if (i !== newItem) i.classList.remove("selected");
        });

        console.log(`Saving new field group with name: ${name}, ID: ${newId}, Table ID: ${tableId}`);

        try {
            const newFG = {
                id: newId,
                name: name,
                description: "",
                visible: true,
                readOnly: false,
                reserved: false,
                icon: null,
                tableId: tableId
            };
            await setTableManagerItem("FieldGroup", newId, newFG);
            saveToSessionStorage(`FieldGroup_${newId}`, newFG);
            console.log(`New field group saved successfully: ${name}, ID: ${newId}`);
        } catch (error) {
            console.error("Failed to save new field group:", error);
            newItem.textContent += " (Save Failed)";
            return;
        }

        attachFieldGroupListListeners(); // Only reattach listeners, don’t reload subsequent divs
    };

    input.addEventListener("blur", saveNewFG);
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            await saveNewFG();
        }
    });
}


async function addFieldAtRuntime(fieldGroupId) {
    console.log(`Adding field at runtime for FieldGroup ID: ${fieldGroupId}`);
    const list = document.getElementById("fieldList");
    if (!list) {
        console.error("Field list not found");
        return;
    }

    // Generate a unique ID locally (using timestamp as a simple fallback)
    const newId = Date.now(); // Ensures uniqueness at runtime
    const newItem = document.createElement("li");
    newItem.classList.add("custom-list-item");
    newItem.dataset.id = newId;
    newItem.innerHTML = `<input type="text" id="newFieldName_${newId}" value="Field ${newId}" style="width: 100%; box-sizing: border-box;">`;

    if (list.children.length === 1 && list.children[0].textContent === "No items") {
        list.innerHTML = "";
    }
    list.appendChild(newItem);

    const input = newItem.querySelector(`#newFieldName_${newId}`);
    input.focus();

    const saveNewField = async () => {
        const name = input.value.trim() || `Field ${newId}`;
        newItem.textContent = name;
        newItem.classList.add("selected");

        document.querySelectorAll("#fieldList .custom-list-item").forEach(i => {
            if (i !== newItem) i.classList.remove("selected");
        });

        console.log(`Saving new field locally with name: ${name}, ID: ${newId}, FieldGroup ID: ${fieldGroupId}`);

        // Create field data object
        const newField = {
            id: newId,
            name: name,
            description: "",
            visible: true,
            readOnly: false,
            reserved: false,
            icon: null,
            dataType: "text", // Default data type
            dataSubType: "none", // Default subtype
            fieldGroupId: fieldGroupId
        };

        // Save to session storage only (no server call)
        saveToSessionStorage(`Field_${newId}`, newField);
        console.log(`New field saved locally: ${name}, ID: ${newId}`);

        // Reattach listeners to update the UI
        attachFieldListListeners();
    };

    input.addEventListener("blur", saveNewField);
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            await saveNewField();
        }
    });
}

async function loadFieldGroupDetails(fieldGroupId) {
    console.log(`Loading field group details for ID: ${fieldGroupId}`);
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divE.style.display = "block";
    divF.style.display = "none";
    divG.style.display = "none";

    try {
        const fieldGroup = await fetchTableManagerItem("FieldGroup", fieldGroupId);
        const fields = await fetchTableManagerListItems("Field", fieldGroupId);
        console.log("Field Group data:", fieldGroup);
        console.log("Fields data:", fields);

        divE.innerHTML = `
            <h3>Field Group Name</h3>
            <input type="text" id="fgName_${fieldGroupId}" value="${fieldGroup.name}">
            <h4>Field Group Description</h4>
            <textarea id="fgDesc_${fieldGroupId}">${fieldGroup.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" id="fgVisible_${fieldGroupId}" ${fieldGroup.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Fields</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldList">
                    ${fields.length ? fields.map(field => `
                        <li class="custom-list-item" data-id="${field.id}" style="display: ${field.visible ? 'block' : 'none'}">${field.name}</li>
                    `).join('') : '<li class="custom-list-item">No items</li>'}
                </ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                ${fieldGroup.icon && fieldGroup.icon.base64 ? `<img src="${fieldGroup.icon.base64}" alt="Field Group Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Field Group Properties</h4>
            <label><input type="checkbox" id="fgReadOnly_${fieldGroupId}" ${fieldGroup.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" id="fgReserved_${fieldGroupId}" ${fieldGroup.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachFieldListListeners();
        updateLastValues();

        const fieldIconBar = divE.querySelector(".icon-bar");
        if (!fieldIconBar) {
            console.error("Field icon bar not found");
            return;
        }
        console.log("Adding event listeners to field icon bar");
        fieldIconBar.children[0].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort up clicked for Fields");
                sortDirection.set("Field", "up");
                await sortItemsAlphabetically("Field", fieldGroupId);
            }
        });
        fieldIconBar.children[1].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort down clicked for Fields");
                sortDirection.set("Field", "down");
                await sortItemsAlphabetically("Field", fieldGroupId);
            }
        });
        fieldIconBar.children[2].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Add clicked for Fields");
                await addTypeableFieldItem(fieldGroupId); // Use runtime addition, no API calls
            }
        });
        fieldIconBar.children[3].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Delete clicked for Fields");
                await deleteItem("Field", fieldGroupId);
            }
        });

        document.getElementById(`fgVisible_${fieldGroupId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                fieldGroup.visible = e.target.checked;
                await setTableManagerItem("FieldGroup", fieldGroupId, fieldGroup);
                saveToSessionStorage(`FieldGroup_${fieldGroupId}`, fieldGroup);
                applyVisibilityRules();
            }
        });
    } catch (error) {
        console.error("Error in loadFieldGroupDetails:", error);
        divE.innerHTML = '<h3>Failed to load Field Group details</h3>';
    }
}

async function loadAreaDetails(areaId) {
    console.log(`Loading area details for ID: ${areaId}`);
    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divC || !divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divC.style.display = "block";
    divD.style.display = "none";
    divE.style.display = "none";
    divF.style.display = "none";
    divG.style.display = "none";

    try {
        const area = await fetchTableManagerItem("Area", areaId);
        const tables = await fetchTableManagerListItems("Table", areaId);
        console.log("Area data:", area);
        console.log("Tables data:", tables);

        divC.innerHTML = `
            <h3>Area Name</h3>
            <input type="text" id="areaName_${areaId}" value="${area.name}">
            <h4>Area Description</h4>
            <textarea id="areaDesc_${areaId}">${area.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" id="areaVisible_${areaId}" ${area.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Tables</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="tableList">
                    ${tables.length ? tables.map(table => `
                        <li class="custom-list-item" data-id="${table.id}" style="display: ${table.visible ? 'block' : 'none'}">${table.name}</li>
                    `).join('') : '<li class="custom-list-item">No items</li>'}
                </ul>
            </div>
            <h4>Area Icon</h4>
            <div class="icon-upload-container">
                ${area.icon && area.icon.base64 ? `<img src="${area.icon.base64}" alt="Area Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Area Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Area Properties</h4>
            <label><input type="checkbox" id="areaReadOnly_${areaId}" ${area.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" id="areaReserved_${areaId}" ${area.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachTableListListeners();
        updateLastValues();

        const tableIconBar = divC.querySelector(".icon-bar");
        if (!tableIconBar) {
            console.error("Table icon bar not found");
            return;
        }
        console.log("Adding event listeners to table icon bar");
        tableIconBar.children[0].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort up clicked for Tables");
                sortDirection.set("Table", "up");
                await sortItemsAlphabetically("Table", areaId);
            }
        });
        tableIconBar.children[1].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort down clicked for Tables");
                sortDirection.set("Table", "down");
                await sortItemsAlphabetically("Table", areaId);
            }
        });
        tableIconBar.children[2].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Add clicked for Tables");
                await addTypeableTableItem(areaId);
            }
        });
        async function addFieldInGroup(fieldGroupId) {
            console.log(`Adding new field inside Fields for FieldGroup ID: ${fieldGroupId}`);
            if (!isLocked) {
                await addTypeableFieldItem(fieldGroupId); // Calls existing function to add a field
            }
        }
        tableIconBar.children[3].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Delete clicked for Tables");
                await deleteItem("Table", areaId);
            }
        });

        document.getElementById(`areaVisible_${areaId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                area.visible = e.target.checked;
                await setTableManagerItem("Area", areaId, area);
                saveToSessionStorage(`Area_${areaId}`, area);
                applyVisibilityRules();
            }
        });
    } catch (error) {
        console.error("Error in loadAreaDetails:", error);
        divC.innerHTML = '<h3>Failed to load Area details</h3>';
    }
}

async function loadEmptyTableDetails(areaId) {
    console.log(`Loading empty table details for Area ID: ${areaId}`);
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divD.style.display = "block";
    divE.style.display = "none";
    divF.style.display = "none";
    divG.style.display = "none";

    divD.innerHTML = `
        <h3>Table Name</h3>
        <input type="text" id="tableName_new" value="" placeholder="Add a table to edit">
        <h4>Table Description</h4>
        <textarea id="tableDesc_new" placeholder="Add a table to edit"></textarea>
        <h4>Status</h4>
        <label><input type="checkbox" id="tableVisible_new"> Visible</label>
        <div class="section-title">
            <span>Field Groups</span>
            <div class="icon-bar">
                <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                <img src="/assets/main-icons/add.png" alt="Add" />
                <img src="/assets/main-icons/delete.png" alt="Delete" />
            </div>
        </div>
        <div class="list-box-container">
            <ul class="custom-list" id="fieldGroupList">
                <li class="custom-list-item">No items</li>
            </ul>
        </div>
        <h4>Table Icon</h4>
        <div class="icon-upload-container">
            <img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">
            <button>Upload Icon</button>
        </div>
        <h4>Table Properties</h4>
        <label><input type="checkbox" id="tableReadOnly_new"> Read only</label>
        <label><input type="checkbox" id="tableReserved_new"> Reserved</label>
        <h4>Table Features</h4>
        <label><input type="checkbox" disabled> Clearance</label>
        <label><input type="checkbox" disabled> Timeline</label>
        <label><input type="checkbox" disabled> Freezing</label>
        <label><input type="checkbox" disabled> Versioning</label>
    `;

    attachFieldGroupListListeners();
    updateLastValues();

    const fieldGroupIconBar = divD.querySelector(".icon-bar");
    if (!fieldGroupIconBar) {
        console.error("Field Group icon bar not found");
        return;
    }
    console.log("Adding event listeners to field group icon bar");
    fieldGroupIconBar.children[0].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Sort up clicked for Field Groups");
            sortDirection.set("FieldGroup", "up");
            await sortItemsAlphabetically("FieldGroup", null);
        }
    });
    fieldGroupIconBar.children[1].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Sort down clicked for Field Groups");
            sortDirection.set("FieldGroup", "down");
            await sortItemsAlphabetically("FieldGroup", null);
        }
    });
    fieldGroupIconBar.children[2].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Add clicked for Field Groups");
            await addItem("FieldGroup", null);
        }
    });



    fieldGroupIconBar.children[3].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Delete clicked for Field Groups");
            await deleteItem("FieldGroup", null);
        }
    });
}

async function loadEmptyFieldGroupDetails(tableId) {
    console.log(`Loading empty field group details`);
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divE.style.display = "block";
    divF.style.display = "none";
    divG.style.display = "none";

    divE.innerHTML = `
        <h3>Field Group Name</h3>
        <input type="text" id="fgName_new" value="" placeholder="Add a field group to edit">
        <h4>Field Group Description</h4>
        <textarea id="fgDesc_new" placeholder="Add a field group to edit"></textarea>
        <h4>Status</h4>
        <label><input type="checkbox" id="fgVisible_new"> Visible</label>
        <div class="section-title">
            <span>Fields</span>
            <div class="icon-bar">
                <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                <img src="/assets/main-icons/add.png" alt="Add" />
                <img src="/assets/main-icons/delete.png" alt="Delete" />
            </div>
        </div>
        <div class="list-box-container">
            <ul class="custom-list" id="fieldList">
                <li class="custom-list-item">No items</li>
            </ul>
        </div>
        <h4>Field Group Icon</h4>
        <div class="icon-upload-container">
            <img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">
            <button>Upload Icon</button>
        </div>
        <h4>Field Group Properties</h4>
        <label><input type="checkbox" id="fgReadOnly_new"> Read only</label>
        <label><input type="checkbox" id="fgReserved_new"> Reserved</label>
    `;

    attachFieldListListeners();
    updateLastValues();

    const fieldIconBar = divE.querySelector(".icon-bar");
    if (!fieldIconBar) {
        console.error("Field icon bar not found");
        return;
    }
    console.log("Adding event listeners to field icon bar");
    fieldIconBar.children[0].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Sort up clicked for Fields");
            sortDirection.set("Field", "up");
            await sortItemsAlphabetically("Field", null);
        }
    });
    fieldIconBar.children[1].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Sort down clicked for Fields");
            sortDirection.set("Field", "down");
            await sortItemsAlphabetically("Field", null);
        }
    });
    fieldIconBar.children[2].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Add clicked for Fields");
            await addItem("Field", null);
        }
    });
    fieldIconBar.children[3].addEventListener("click", async () => {
        if (!isLocked) {
            console.log("Delete clicked for Fields");
            await deleteItem("Field", null);
        }
    });
}

async function loadEmptyFieldDetails(fieldGroupId) {
    console.log(`Loading empty field details`);
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divF.style.display = "block";
    divG.style.display = "block";

    divF.innerHTML = `
        <h3 style="color: #ffffff; margin-bottom: 15px;">Field Name</h3>
        <input type="text" id="fieldName_new" value="" placeholder="Add a field to edit" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Description</h4>
        <textarea id="fieldDesc_new" placeholder="Add a field to edit" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: vertical;"></textarea>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Status</h4>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldVisible_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldVisible_new" style="color: #ffffff; font-size: 14px;">Visible</label>
            </div>
        </div>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data Type</h4>
        <select id="fieldDataType_new" style="width: 100%; padding: 6px; margin-bottom: 15px;">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
        </select>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data SubType</h4>
        <select id="fieldDataSubType_new" style="width: 100%; padding: 6px; margin-bottom: 15px;">
            <option value="none">None</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="url">URL</option>
        </select>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Icon</h4>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <img src="/assets/main-icons/home.png" alt="Field Icon" style="width: 24px; height: 24px;">
            <button style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Upload Icon</button>
        </div>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Properties</h4>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldReadOnly_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldReadOnly_new" style="color: #ffffff; font-size: 14px;">Read only</label>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldReserved_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldReserved_new" style="color: #ffffff; font-size: 14px;">Reserved</label>
            </div>
        </div>
        <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldCompulsory_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldCompulsory_new" style="color: #ffffff; font-size: 14px;">Compulsory</label>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldLabel_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldLabel_new" style="color: #ffffff; font-size: 14px;">Label</label>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                <input type="checkbox" id="fieldFullText_new" style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                <label for="fieldFullText_new" style="color: #ffffff; font-size: 14px;">Full text indexed (if text)</label>
            </div>
        </div>
    `;

    divG.innerHTML = `
        <h3 style="color: #ffffff; margin-bottom: 15px;">Field Settings</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Default Value</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Validation Rules</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Style</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="Default" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Data Snip</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Function</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                <span>Client Help</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
            </label>
            <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
        </div>
    `;

    updateLastValues();

    divG.querySelectorAll("img[alt='Settings']").forEach(icon => {
        icon.addEventListener("click", () => {
            if (!isLocked) {
                const settingType = icon.parentElement.querySelector("span").textContent;
                console.log(`Settings icon clicked for: ${settingType}`);
                openSettings(settingType);
            }
        });
    });
}

async function loadTableDetails(tableId) {
    console.log(`Loading table details for ID: ${tableId}`);
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divD.style.display = "block";
    divE.style.display = "none";
    divF.style.display = "none";
    divG.style.display = "none";

    try {
        const table = await fetchTableManagerItem("Table", tableId);
        const fieldGroups = await fetchTableManagerListItems("FieldGroup", tableId);
        console.log("Table data:", table);
        console.log("Field Groups data:", fieldGroups);

        divD.innerHTML = `
            <h3>Table Name</h3>
            <input type="text" id="tableName_${tableId}" value="${table.name}">
            <h4>Table Description</h4>
            <textarea id="tableDesc_${tableId}">${table.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" id="tableVisible_${tableId}" ${table.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Field Groups</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldGroupList">
                    ${fieldGroups.length ? fieldGroups.map(fg => `
                        <li class="custom-list-item" data-id="${fg.id}" style="display: ${fg.visible ? 'block' : 'none'}">${fg.name}</li>
                    `).join('') : '<li class="custom-list-item">No items</li>'}
                </ul>
            </div>
            <h4>Table Icon</h4>
            <div class="icon-upload-container">
                ${table.icon && table.icon.base64 ? `<img src="${table.icon.base64}" alt="Table Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Table Properties</h4>
            <label><input type="checkbox" id="tableReadOnly_${tableId}" ${table.systemProperties?.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" id="tableReserved_${tableId}" ${table.systemProperties?.reserved ? 'checked' : ''}> Reserved</label>
            <h4>Table Features</h4>
            <label><input type="checkbox" ${table.systemProperties?.clearance ? 'checked' : ''} disabled> Clearance</label>
            <label><input type="checkbox" ${table.systemProperties?.timeline ? 'checked' : ''} disabled> Timeline</label>
            <label><input type="checkbox" ${table.systemProperties?.freezing ? 'checked' : ''} disabled> Freezing</label>
            <label><input type="checkbox" ${table.systemProperties?.versioning ? 'checked' : ''} disabled> Versioning</label>
        `;

        attachFieldGroupListListeners();
        updateLastValues();

        const fieldGroupIconBar = divD.querySelector(".icon-bar");
        if (!fieldGroupIconBar) {
            console.error("Field Group icon bar not found");
            return;
        }
        console.log("Adding event listeners to field group icon bar");
        fieldGroupIconBar.children[0].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort up clicked for Field Groups");
                sortDirection.set("FieldGroup", "up");
                await sortItemsAlphabetically("FieldGroup", tableId);
            }
        });
        fieldGroupIconBar.children[1].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort down clicked for Field Groups");
                sortDirection.set("FieldGroup", "down");
                await sortItemsAlphabetically("FieldGroup", tableId);
            }
        });
        fieldGroupIconBar.children[2].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Add clicked for Field Groups");
                await addTypeableFieldGroupItem(tableId); // This calls the updated function
            }
        });
        fieldGroupIconBar.children[3].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Delete clicked for Field Groups");
                await deleteItem("FieldGroup", tableId);
            }
        });

        document.getElementById(`tableVisible_${tableId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                table.visible = e.target.checked;
                await setTableManagerItem("Table", tableId, table);
                saveToSessionStorage(`Table_${tableId}`, table);
                applyVisibilityRules();
            }
        });
    } catch (error) {
        console.error("Error in loadTableDetails:", error);
        divD.innerHTML = '<h3>Failed to load Table details</h3>';
    }
}
async function addTypeableFieldItem(fieldGroupId) {
    console.log(`Adding typeable field item for FieldGroup ID: ${fieldGroupId}`);
    const list = document.getElementById("fieldList");
    if (!list) {
        console.error("Field list not found");
        return;
    }

    // Generate a unique ID locally (no server fetch)
    let newId = Date.now(); // Use timestamp for uniqueness at runtime

    const newItem = document.createElement("li");
    newItem.classList.add("custom-list-item");
    newItem.dataset.id = newId;
    newItem.innerHTML = `<input type="text" id="newFieldName_${newId}" value="Field ${newId}" style="width: 100%; box-sizing: border-box;">`;

    if (list.children.length === 1 && list.children[0].textContent === "No items") {
        list.innerHTML = "";
    }
    list.appendChild(newItem);

    const input = newItem.querySelector(`#newFieldName_${newId}`);
    input.focus();

    const saveNewField = async () => {
        const name = input.value.trim() || `Field ${newId}`;
        newItem.textContent = name;
        newItem.classList.add("selected");

        document.querySelectorAll("#fieldList .custom-list-item").forEach(i => {
            if (i !== newItem) i.classList.remove("selected");
        });

        console.log(`Saving new field with name: ${name}, ID: ${newId}, FieldGroup ID: ${fieldGroupId}`);

        // Define the new field object (no API call)
        const newField = {
            id: newId,
            name: name,
            description: "",
            visible: true,
            readOnly: false,
            reserved: false,
            icon: null,
            dataType: "text", // Default data type
            dataSubType: "none", // Default subtype
            fieldGroupId: fieldGroupId
        };

        // Save to session storage only (no server interaction)
        saveToSessionStorage(`Field_${newId}`, newField);
        console.log(`New field saved successfully: ${name}, ID: ${newId}`);

        // Reattach listeners to keep the UI interactive
        attachFieldListListeners();
    };

    input.addEventListener("blur", saveNewField);
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            await saveNewField();
        }
    });
}

async function loadFieldGroupDetails(fieldGroupId) {
    console.log(`Loading field group details for ID: ${fieldGroupId}`);
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divE.style.display = "block";
    divF.style.display = "none";
    divG.style.display = "none";

    try {
        const fieldGroup = await fetchTableManagerItem("FieldGroup", fieldGroupId);
        const fields = await fetchTableManagerListItems("Field", fieldGroupId);
        console.log("Field Group data:", fieldGroup);
        console.log("Fields data:", fields);

        divE.innerHTML = `
            <h3>Field Group Name</h3>
            <input type="text" id="fgName_${fieldGroupId}" value="${fieldGroup.name}">
            <h4>Field Group Description</h4>
            <textarea id="fgDesc_${fieldGroupId}">${fieldGroup.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" id="fgVisible_${fieldGroupId}" ${fieldGroup.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Fields</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Down" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldList">
                    ${fields.length ? fields.map(field => `
                        <li class="custom-list-item" data-id="${field.id}" style="display: ${field.visible ? 'block' : 'none'}">${field.name}</li>
                    `).join('') : '<li class="custom-list-item">No items</li>'}
                </ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                ${fieldGroup.icon && fieldGroup.icon.base64 ? `<img src="${fieldGroup.icon.base64}" alt="Field Group Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Field Group Properties</h4>
            <label><input type="checkbox" id="fgReadOnly_${fieldGroupId}" ${fieldGroup.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" id="fgReserved_${fieldGroupId}" ${fieldGroup.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachFieldListListeners();
        updateLastValues();

        const fieldIconBar = divE.querySelector(".icon-bar");
        if (!fieldIconBar) {
            console.error("Field icon bar not found");
            return;
        }
        console.log("Adding event listeners to field icon bar");
        fieldIconBar.children[0].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort up clicked for Fields");
                sortDirection.set("Field", "up");
                await sortItemsAlphabetically("Field", fieldGroupId);
            }
        });
        fieldIconBar.children[1].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Sort down clicked for Fields");
                sortDirection.set("Field", "down");
                await sortItemsAlphabetically("Field", fieldGroupId);
            }
        });
        fieldIconBar.children[2].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Add clicked for Fields");
                await addFieldAtRuntime(fieldGroupId); // Use runtime addition instead of addItem
            }
        });
        fieldIconBar.children[3].addEventListener("click", async () => {
            if (!isLocked) {
                console.log("Delete clicked for Fields");
                await deleteItem("Field", fieldGroupId);
            }
        });

        document.getElementById(`fgVisible_${fieldGroupId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                fieldGroup.visible = e.target.checked;
                await setTableManagerItem("FieldGroup", fieldGroupId, fieldGroup);
                saveToSessionStorage(`FieldGroup_${fieldGroupId}`, fieldGroup);
                applyVisibilityRules();
            }
        });
    } catch (error) {
        console.error("Error in loadFieldGroupDetails:", error);
        divE.innerHTML = '<h3>Failed to load Field Group details</h3>';
    }
}
async function loadFieldDetails(fieldId) {
    console.log(`Loading field details for ID: ${fieldId}`);
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divF.style.display = "block";
    divG.style.display = "block";

    try {
        const field = await fetchTableManagerItem("Field", fieldId);
        console.log("Field data:", field);

        divF.innerHTML = `
            <h3 style="color: #ffffff; margin-bottom: 15px;">Field Name</h3>
            <input type="text" id="fieldName_${fieldId}" value="${field.name || 'Unnamed'}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Description</h4>
            <textarea id="fieldDesc_${fieldId}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: vertical;">${field.description || ''}</textarea>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Status</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldVisible_${fieldId}" ${field.visible ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldVisible_${fieldId}" style="color: #ffffff; font-size: 14px;">Visible</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data Type</h4>
            <input type="text" value="${field.dataType || ''}" readonly style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data SubType</h4>
            <input type="text" value="${field.dataSubType || ''}" readonly style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Icon</h4>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <img src="${field.icon && field.icon.base64 ? field.icon.base64 : '/assets/main-icons/home.png'}" alt="Field Icon" style="width: 24px; height: 24px;">
                <button style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Upload Icon</button>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldReadOnly_${fieldId}" ${field.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldReadOnly_${fieldId}" style="color: #ffffff; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldReserved_${fieldId}" ${field.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldReserved_${fieldId}" style="color: #ffffff; font-size: 14px;">Reserved</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldCompulsory_${fieldId}" ${field.compulsory ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldCompulsory_${fieldId}" style="color: #ffffff; font-size: 14px;">Compulsory</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldLabel_${fieldId}" ${field.label ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldLabel_${fieldId}" style="color: #ffffff; font-size: 14px;">Label</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fieldFullText_${fieldId}" ${field.fullText ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fieldFullText_${fieldId}" style="color: #ffffff; font-size: 14px;">Full text indexed (if text)</label>
                </div>
            </div>
        `;

        divG.innerHTML = `
            <h3 style="color: #ffffff; margin-bottom: 15px;">Field Settings</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Default Value</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Validation Rules</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Style</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="Default" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Data Snip</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Function</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
                    <span>Client Help</span>
                    <img src="/assets/main-icons/settings.png" alt="Settings" style="width: 16px; height: 16px; cursor: pointer;">
                </label>
                <input type="text" value="None" readonly style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            </div>
        `;

        updateLastValues();

        divG.querySelectorAll("img[alt='Settings']").forEach(icon => {
            icon.addEventListener("click", () => {
                if (!isLocked) {
                    const settingType = icon.parentElement.querySelector("span").textContent;
                    openEmptySettingsOverlay(settingType, fieldId);
                }
            });
        });

        document.getElementById(`fieldVisible_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.visible = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
                applyVisibilityRules();
            }
        });

        // Add event listeners for other editable fields
        document.getElementById(`fieldName_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.name = e.target.value;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldDesc_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.description = e.target.value;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldReadOnly_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.readOnly = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldReserved_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.reserved = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldCompulsory_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.compulsory = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldLabel_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.label = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

        document.getElementById(`fieldFullText_${fieldId}`).addEventListener('change', async (e) => {
            if (!isLocked) {
                field.fullText = e.target.checked;
                await setTableManagerItem("Field", fieldId, field);
                saveToSessionStorage(`Field_${fieldId}`, field);
            }
        });

    } catch (error) {
        console.error("Error in loadFieldDetails:", error);
        divF.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field details</h3>';
        divG.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field settings</h3>';
    }
}

// Required supporting function for the overlay
function openEmptySettingsOverlay(settingType, fieldId = null) {
    console.log(`Settings icon clicked for: ${settingType}${fieldId ? `, Field ID: ${fieldId}` : ''}`);

    const settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';
    settingsOverlay.style.cssText = `
        position: fixed;
        top: 10%;
        right: -5%;
        transform: translateX(-50%);
        width: 300px;
        height: 200px;
        background: #fff;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;

    settingsOverlay.innerHTML = `
        <button style="position: absolute; top: 10px; right: 10px;" 
                onclick="this.parentElement.remove()">Close</button>
    `;

    document.body.appendChild(settingsOverlay);
}

async function sortItemsAlphabetically(type, parentId = null) {
    console.log(`Sorting items alphabetically - Type: ${type}, ParentID: ${parentId}`);
    const listId = type === "Area" ? "areaList" :
        type === "Table" ? "tableList" :
            type === "FieldGroup" ? "fieldGroupList" :
                "fieldList";
    const list = document.getElementById(listId);
    if (!list) {
        console.error(`List not found: ${listId}`);
        return;
    }

    const items = Array.from(list.querySelectorAll(".custom-list-item"));
    if (items.length === 0 || (items.length === 1 && items[0].textContent === "No items")) {
        console.log("No items to sort");
        return;
    }

    const direction = sortDirection.get(type) || "up";
    items.sort((a, b) => direction === "up" ?
        a.textContent.localeCompare(b.textContent) :
        b.textContent.localeCompare(a.textContent));
    list.innerHTML = items.map(item => item.outerHTML).join("");

    if (type === "Area") {
        attachAreaListListeners();
    } else if (type === "Table") {
        attachTableListListeners();
    } else if (type === "FieldGroup") {
        attachFieldGroupListListeners();
    } else if (type === "Field") {
        attachFieldListListeners();
    }

    console.log(`Successfully sorted ${type} items alphabetically (${direction})`);
}

async function deleteItem(type, parentId = null) {
    console.log(`Deleting item - Type: ${type}, ParentID: ${parentId}`);
    const listId = type === "Area" ? "areaList" :
        type === "Table" ? "tableList" :
            type === "FieldGroup" ? "fieldGroupList" :
                "fieldList";
    const list = document.getElementById(listId);
    if (!list) {
        console.error(`List not found: ${listId}`);
        return;
    }

    const selected = list.querySelector(".custom-list-item.selected");
    if (!selected) {
        console.log("No item selected for deletion");
        return;
    }

    const itemId = selected.dataset.id;

    if (type === "Area") {
        const tables = document.querySelectorAll(`#tableList .custom-list-item`);
        tables.forEach(table => deleteCascadingData("Table", table.dataset.id));
        document.querySelector(".area-details").innerHTML = "";
    } else if (type === "Table") {
        const fieldGroups = document.querySelectorAll(`#fieldGroupList .custom-list-item`);
        fieldGroups.forEach(fg => deleteCascadingData("FieldGroup", fg.dataset.id));
        document.querySelector(".table-details").innerHTML = "";
    } else if (type === "FieldGroup") {
        const fields = document.querySelectorAll(`#fieldList .custom-list-item`);
        fields.forEach(field => deleteCascadingData("Field", field.dataset.id));
        document.querySelector(".field-details").innerHTML = "";
    } else if (type === "Field") {
        document.querySelector(".field-settings").innerHTML = "";
        document.querySelector(".field-settings-details").innerHTML = "";
    }

    selected.remove();

    if (list.children.length === 0) {
        list.innerHTML = '<li class="custom-list-item">No items</li>';
    }

    if (type === "Area") {
        attachAreaListListeners();
    } else if (type === "Table") {
        attachTableListListeners();
    } else if (type === "FieldGroup") {
        attachFieldGroupListListeners();
    } else if (type === "Field") {
        attachFieldListListeners();
    }

    console.log(`Successfully deleted ${type} item with ID: ${itemId} and its associated data`);
}

function deleteCascadingData(type, itemId) {
    console.log(`Cascading delete - Type: ${type}, ID: ${itemId}`);
    const listId = type === "Table" ? "tableList" :
        type === "FieldGroup" ? "fieldGroupList" :
            "fieldList";
    const list = document.getElementById(listId);
    if (list) {
        const items = list.querySelectorAll(`.custom-list-item[data-id="${itemId}"]`);
        items.forEach(item => item.remove());

        if (type === "Table") {
            const fieldGroups = document.querySelectorAll(`#fieldGroupList .custom-list-item`);
            fieldGroups.forEach(fg => deleteCascadingData("FieldGroup", fg.dataset.id));
            document.querySelector(".table-details").innerHTML = "";
        } else if (type === "FieldGroup") {
            const fields = document.querySelectorAll(`#fieldList .custom-list-item`);
            fields.forEach(field => deleteCascadingData("Field", field.dataset.id));
            document.querySelector(".field-details").innerHTML = "";
        } else if (type === "Field") {
            document.querySelector(".field-settings").innerHTML = "";
            document.querySelector(".field-settings-details").innerHTML = "";
        }
    }
}

async function addItem(type, parentId = null) {
    console.log(`Adding item - Type: ${type}, ParentID: ${parentId}`);
    const listId = type === "Area" ? "areaList" :
        type === "Table" ? "tableList" :
            type === "FieldGroup" ? "fieldGroupList" :
                "fieldList";
    const list = document.getElementById(listId);
    if (!list) {
        console.error(`List not found: ${listId}`);
        return;
    }

    try {
        const items = await fetchTableManagerListItems(type, parentId);
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        const newItemHtml = `<li class="custom-list-item" data-id="${newId}">${type} ${items.length + 1}</li>`;

        if (list.children.length === 1 && list.children[0].textContent === "No items") {
            list.innerHTML = newItemHtml;
        } else {
            list.insertAdjacentHTML('beforeend', newItemHtml);
        }

        const newItemData = {
            id: newId,
            name: `${type} ${items.length + 1}`,
            description: "",
            visible: true,
            readOnly: false,
            reserved: false,
            icon: null,
            ...(type === "Field" ? { dataType: "text", dataSubType: "none" } : {})
        };
        await setTableManagerItem(type, newId, newItemData);
        saveToSessionStorage(`${type}_${newId}`, newItemData);

        if (type === "Area") {
            attachAreaListListeners();
            await populateAreasList();
        } else if (type === "Table") {
            attachTableListListeners();
            await loadAreaDetails(parentId);
        } else if (type === "FieldGroup") {
            attachFieldGroupListListeners();
            await loadTableDetails(parentId);
        } else if (type === "Field") {
            attachFieldListListeners();
            await loadFieldGroupDetails(parentId);
        }

        console.log(`Successfully added new ${type} item with ID: ${newId}`);
    } catch (error) {
        console.error(`Error in addItem (${type}):`, error);
    }
}

function attachAreaListListeners() {
    document.querySelectorAll("#areaList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            if (!isLocked) {
                console.log(`Area clicked: ${item.dataset.id}`);
                document.querySelectorAll("#areaList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const areaId = item.dataset.id;
                await loadAreaDetails(areaId);
                await loadEmptyTableDetails(areaId);
                await loadEmptyFieldGroupDetails(null);
                await loadEmptyFieldDetails(null);
            }
        });
    });
}

function attachTableListListeners() {
    document.querySelectorAll("#tableList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            if (!isLocked) {
                console.log(`Table clicked: ${item.dataset.id}`);
                document.querySelectorAll("#tableList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const tableId = item.dataset.id;
                await loadTableDetails(tableId);
                await loadEmptyFieldGroupDetails(tableId);
                await loadEmptyFieldDetails(null);
            }
        });
    });
}

function attachFieldGroupListListeners() {
    document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            if (!isLocked) {
                console.log(`Field Group clicked: ${item.dataset.id}`);
                document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const fieldGroupId = item.dataset.id;
                await loadFieldGroupDetails(fieldGroupId);
                await loadEmptyFieldDetails(fieldGroupId);
            }
        });
    });
}

function attachFieldListListeners() {
    document.querySelectorAll("#fieldList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            if (!isLocked) {
                console.log(`Field clicked: ${item.dataset.id}`);
                document.querySelectorAll("#fieldList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const fieldId = item.dataset.id;
                await loadFieldDetails(fieldId);
            }
        });
    });
}

function openSettings(settingType) {
    console.log(`Opening settings for: ${settingType}`);
    // Implement settings logic here if needed
}

async function loadMenu() {
    console.log("Loading menu");
    if (!token || !userId) {
        console.error("Token or UserId missing");
        return;
    }

    try {
        const response = await fetch(`/api/menu?token=${token}&userId=${userId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log(`Menu fetch status: ${response.status}`);

        if (!response.ok) throw new Error(`Failed to load menu: ${response.statusText}`);

        const menuItems = await response.json();
        console.log("Menu Items:", menuItems);

        const menuList = document.getElementById("menuList");
        if (!menuList) {
            console.error("Menu list element not found");
            return;
        }
        menuList.innerHTML = menuItems.map(item => `
            <li class="nav-item mb-3">
                <a class="nav-link text-white" href="#" data-id="${item.id}" title="${item.description}">
                    <img src="${item.icon?.base64 || `/assets/main-icons/default-icon-${item.id}.png`}" alt="${item.icon?.alternativeText || item.description}" width="24" height="24">
                </a>
            </li>
        `).join("");

        const sidebar = document.querySelector(".sidebar");
        const floatingLabel = document.getElementById("floatingLabel");
        if (!sidebar || !floatingLabel) {
            console.error("Sidebar or floating label not found");
            return;
        }
        sidebar.appendChild(floatingLabel);

        let activeId = null;
        let hideTooltipTimeout;

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("mouseenter", (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                activeId = id;
                console.log(`Menu item hover: ${id}`);

                const navItem = e.currentTarget;
                const sidebarRect = sidebar.getBoundingClientRect();
                const itemRect = navItem.getBoundingClientRect();

                let labelText;
                switch (id) {
                    case 1: labelText = "Table Manager"; break;
                    case 2: labelText = "InternalUserManager"; break;
                    case 3: labelText = "ExternalUserManager"; break;
                    default: labelText = navItem.getAttribute("title") || "Menu Item";
                }

                const relativeTop = itemRect.top - sidebarRect.top;
                floatingLabel.style.top = `${relativeTop}px`;
                floatingLabel.textContent = labelText;
                floatingLabel.style.display = "block";

                clearTimeout(hideTooltipTimeout);
            });

            link.addEventListener("mouseleave", () => {
                console.log("Menu item mouse leave");
                hideTooltipTimeout = setTimeout(() => {
                    floatingLabel.style.display = "none";
                    activeId = null;
                }, 200);
            });
        });

        floatingLabel.addEventListener("mouseenter", () => {
            console.log("Floating label hover");
            clearTimeout(hideTooltipTimeout);
        });

        floatingLabel.addEventListener("mouseleave", () => {
            console.log("Floating label mouse leave");
            hideTooltipTimeout = setTimeout(() => {
                floatingLabel.style.display = "none";
                activeId = null;
            }, 200);
        });

        floatingLabel.addEventListener("click", async () => {
            console.log(`Floating label clicked, activeId: ${activeId}`);
            if (activeId === null) return;

            const contentArea = document.getElementById("dashboardContent");
            const tableManagerContainer = document.getElementById("tableManagerContainer");

            if (!contentArea || !tableManagerContainer) {
                console.error("Content area or table manager container not found");
                return;
            }

            if (activeId === 1) {
                contentArea.querySelector("h1").style.display = "none";
                contentArea.querySelector("p").style.display = "none";
                tableManagerContainer.style.display = "flex";
                await populateAreasList();
            }
        });
    } catch (error) {
        console.error("Error in loadMenu:", error);
    }
}

const logoutToggle = document.getElementById("logoutToggle");
const logoutPopup = document.getElementById("logoutPopup");
const cancelBtn = document.getElementById("cancelLogout");

if (logoutToggle) {
    logoutToggle.addEventListener("click", (e) => {
        console.log("Logout toggle clicked");
        e.preventDefault();
        logoutPopup.style.display = logoutPopup.style.display === "block" ? "none" : "block";
    });
} else {
    console.error("Logout toggle element not found");
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        console.log("Cancel logout clicked");
        logoutPopup.style.display = "none";
    });
} else {
    console.error("Cancel button not found");
}

document.addEventListener("click", (e) => {
    if (!logoutPopup.contains(e.target) && !logoutToggle.contains(e.target)) {
        console.log("Click outside logout popup");
        logoutPopup.style.display = "none";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, initializing menu");
    loadMenu();

    const lockIcon = document.querySelector('img[src="/assets/Icons/lock.svg"]');
    const undoIcon = document.querySelector('img[src="/assets/Icons/undo.svg"]');

    if (lockIcon) lockIcon.addEventListener('click', toggleLockControls);
    if (undoIcon) undoIcon.addEventListener('click', undoChanges);

    document.addEventListener('input', (e) => {
        if (!isLocked && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            updateLastValues();
        }
    });

    document.addEventListener('change', (e) => {
        if (!isLocked && e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            updateLastValues();
        }
    });
});