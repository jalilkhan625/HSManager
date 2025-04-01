const token = document.getElementById("token").value;
const userId = document.getElementById("userId").value;

console.log("Initializing - Token:", token)
console.log("Initializing - UserID:", userId);

// Generic fetch function with authentication
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
            const errorText = await response.text();
            throw new Error(`Failed to fetch: ${response.status} - ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log(`Response data for ${url}:`, data);
        return data;
    } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        throw error;
    }
}

// Fetch list items from table manager API
async function fetchTableManagerListItems(itemType, itemId) {
    const url = `/api/tablemanager/list?itemType=${itemType}${itemId !== null ? `&itemId=${itemId}` : ''}`;
    console.log(`Fetching list items - Type: ${itemType}, ID: ${itemId}`);
    return await fetchWithAuth(url);
}

// Fetch a single item from table manager API
async function fetchTableManagerItem(itemType, itemId) {
    const url = `/api/tablemanager/item?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Fetching item - Type: ${itemType}, ID: ${itemId}`);
    return await fetchWithAuth(url);
}

// Set or update an item in table manager API
async function setTableManagerItem(itemType, itemId, item) {
    const url = `/api/tablemanager/set?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Setting item - Type: ${itemType}, ID: ${itemId}`);
    return await fetchWithAuth(url, 'POST', item);
}

// Populate the areas list
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
        const newAreas = JSON.parse(sessionStorage.getItem("newAreas") || "{}");
        listBox.innerHTML = areas.map(area => `
            <li class="custom-list-item" data-id="${area.id}">${area.name || 'Unnamed'}</li>
        `).concat(Object.entries(newAreas).map(([id, area]) => `
            <li class="custom-list-item" data-id="${id}">${area.name}</li>
        `)).join("");

        if (listBox.querySelectorAll(".custom-list-item").length === 0) {
            listBox.innerHTML = '<li class="custom-list-item">No areas yet</li>';
        } else {
            attachAreaListListeners();

            const areaIconBar = document.querySelector(".table-manager .icon-bar");
            if (!areaIconBar) {
                console.error("Area icon bar not found");
                return;
            }
            console.log("Adding event listeners to area icon bar");
            areaIconBar.children[0].addEventListener("click", async () => {
                console.log("Sort alphabetically clicked for Areas (up)");
                await sortItemsAlphabetically("Area");
            });
            areaIconBar.children[1].addEventListener("click", async () => {
                console.log("Sort alphabetically clicked for Areas (down)");
                await sortItemsAlphabetically("Area");
            });
            areaIconBar.children[2].addEventListener("click", async () => {
                console.log("Add clicked for Areas");
                await addItem("Area");
            });
            areaIconBar.children[3].addEventListener("click", async () => {
                console.log("Delete clicked for Areas");
                await deleteItem("Area");
            });
        }
    } catch (error) {
        console.error("Error in populateAreasList:", error.message);
        listBox.innerHTML = `<li class="custom-list-item error">Failed to load Areas: ${error.message}</li>`;
    }
}

// Load details for a specific area and cascade data for special areas
async function loadAreaDetails(areaId) {
    console.log(`Loading area details for ID: ${areaId}`);
    if (!areaId) {
        console.error("No areaId provided");
        return;
    }

    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divC || !divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divC.style.display = "block"; // Show area details

    const newAreas = JSON.parse(sessionStorage.getItem("newAreas") || "{}");
    if (newAreas[areaId]) {
        const area = newAreas[areaId];
        console.log("Loading area from sessionStorage:", area);
        const tables = Object.entries(area.tables || {}).map(([id, table]) => `
        <li class="custom-list-item" data-id="${id}">${table.name}</li>
    `).join('') || '<li class="custom-list-item">No tables yet</li>';
        divC.innerHTML = `
        <h3>Area Name</h3>
        <input type="text" value="${area.name}">
        <h4>Area Description</h4>
        <textarea>${area.description || ''}</textarea>
        <h4>Status</h4>
        <label><input type="checkbox" ${area.visible ? 'checked' : ''}> Visible</label>
        <div class="section-title">
            <span>Tables</span>
            <div class="icon-bar" style="display: flex; gap: 10px; width: 120px;">
                <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                <img src="/assets/main-icons/add.png" alt="Add" />
                <img src="/assets/main-icons/delete.png" alt="Delete" />
            </div>
        </div>
        <div class="list-box-container">
            <ul class="custom-list" id="tableList">${tables}</ul>
        </div>
        // ... (rest of the HTML)
    `;
        attachTableListListeners();
        addIconBarListeners(divC.querySelector(".icon-bar"), "Table", areaId);
        return;
    }

    try {
        const area = await fetchTableManagerItem("Area", areaId);
        if (!area || typeof area !== "object") {
            throw new Error("Invalid area data received");
        }
        const tables = await fetchTableManagerListItems("Table", areaId);
        console.log("Area data:", area);
        console.log("Tables data:", tables);

        divC.innerHTML = `
            <h3>Area Name</h3>
            <input type="text" value="${area.name || 'Unnamed'}">
            <h4>Area Description</h4>
            <textarea>${area.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${area.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Tables</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="tableList">
                    ${(tables || []).map(table => `
                        <li class="custom-list-item" data-id="${table.id}">${table.name || 'Unnamed'}</li>
                    `).join('') || '<li class="custom-list-item">No tables yet</li>'}
                </ul>
            </div>
            <h4>Area Icon</h4>
            <div class="icon-upload-container">
                ${area.icon && area.icon.base64 ? `<img src="${area.icon.base64}" alt="Area Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Area Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Area Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheckArea" ${area.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheckArea" style="color: #000000; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheckArea" ${area.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheckArea" style="color: #000000; font-size: 14px;">Reserved</label>
                </div>
            </div>
        `;

        attachTableListListeners();
        addIconBarListeners(divC.querySelector(".icon-bar"), "Table", areaId);

        // Check if this is a special area (e.g., "Organization" or "Hyperspace")
        const specialAreas = ["Organization", "Hyperspace"];
        if (specialAreas.includes(area.name)) {
            console.log(`Detected special area: ${area.name}, loading full hierarchy`);
            if (tables && tables.length > 0) {
                const firstTable = tables[0];
                const tableItems = divC.querySelectorAll("#tableList .custom-list-item");
                tableItems.forEach(item => item.classList.remove("selected"));
                const firstTableItem = Array.from(tableItems).find(item => item.dataset.id === firstTable.id.toString());
                if (firstTableItem) {
                    firstTableItem.classList.add("selected");
                    await loadTableDetails(firstTable.id, true);
                }
            }
        }
    } catch (error) {
        console.error("Error in loadAreaDetails:", error.message);
        divC.innerHTML = `<h3>Failed to load Area details: ${error.message}</h3>`;
    }
}

// Load table details and cascade for special areas
async function loadTableDetails(tableId, cascade = false) {
    console.log(`Loading table details for ID: ${tableId}, Cascade: ${cascade}`);
    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divC || !divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divD.style.display = "block";
    divC.style.display = "block";

    const newTables = JSON.parse(sessionStorage.getItem("newTables") || "{}");
    if (newTables[tableId]) {
        const table = newTables[tableId];
        console.log("Loading table from sessionStorage:", table);
        const fieldGroups = Object.entries(table.fieldGroups || {}).map(([id, fg]) => `
            <li class="custom-list-item" data-id="${id}">${fg.name}</li>
        `).join('') || '<li class="custom-list-item">No field groups yet</li>';
        divD.innerHTML = `
            <h3>Table Name</h3>
            <input type="text" value="${table.name}">
            <h4>Table Description</h4>
            <textarea>${table.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${table.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Field Groups</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldGroupList">${fieldGroups}</ul>
            </div>
            <h4>Table Icon</h4>
            <div class="icon-upload-container">
                <img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">
                <button>Upload Icon</button>
            </div>
            <h4>Table Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheckTable" ${table.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheckTable" style="color: #000000; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheckTable" ${table.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheckTable" style="color: #000000; font-size: 14px;">Reserved</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="settingDataTableCheck" ${table.properties?.settingDataTable ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="settingDataTableCheck" style="color: #000000; font-size: 14px;">Setting Data Table</label>
                </div>
            </div>
        `;
        attachFieldGroupListListeners();
        addIconBarListeners(divD.querySelector(".icon-bar"), "FieldGroup", tableId);
        return;
    }

    try {
        const table = await fetchTableManagerItem("Table", tableId);
        const fieldGroups = await fetchTableManagerListItems("FieldGroup", tableId);
        console.log("Table data:", table);
        console.log("Field Groups data:", fieldGroups);

        divD.innerHTML = `
            <h3>Table Name</h3>
            <input type="text" value="${table.name}">
            <h4>Table Description</h4>
            <textarea>${table.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${table.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Field Groups</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldGroupList">
                    ${(fieldGroups || []).map(fg => `
                        <li class="custom-list-item" data-id="${fg.id}">${fg.name}</li>
                    `).join('') || '<li class="custom-list-item">No field groups yet</li>'}
                </ul>
            </div>
            <h4>Table Icon</h4>
            <div class="icon-upload-container">
                ${table.icon && table.icon.base64 ? `<img src="${table.icon.base64}" alt="Table Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Table Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheckTable" ${table.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheckTable" style="color: #000000; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheckTable" ${table.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheckTable" style="color: #000000; font-size: 14px;">Reserved</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="settingDataTableCheck" ${table.properties?.settingDataTable ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="settingDataTableCheck" style="color: #000000; font-size: 14px;">Setting Data Table</label>
                </div>
            </div>
        `;

        attachFieldGroupListListeners();
        addIconBarListeners(divD.querySelector(".icon-bar"), "FieldGroup", tableId);

        if (cascade && fieldGroups && fieldGroups.length > 0) {
            const firstFieldGroup = fieldGroups[0];
            const fgItems = divD.querySelectorAll("#fieldGroupList .custom-list-item");
            fgItems.forEach(item => item.classList.remove("selected"));
            const firstFgItem = Array.from(fgItems).find(item => item.dataset.id === firstFieldGroup.id.toString());
            if (firstFgItem) {
                firstFgItem.classList.add("selected");
                await loadFieldGroupDetails(firstFieldGroup.id, true);
            }
        }
    } catch (error) {
        console.error("Error in loadTableDetails:", error);
        divD.innerHTML = '<h3>Failed to load Table details</h3>';
    }
}

// Load field group details and cascade for special areas
async function loadFieldGroupDetails(fieldGroupId, cascade = false) {
    console.log(`Loading field group details for ID: ${fieldGroupId}, Cascade: ${cascade}`);
    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divC || !divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divE.style.display = "block";
    divD.style.display = "block";
    divC.style.display = "block";

    const newFieldGroups = JSON.parse(sessionStorage.getItem("newFieldGroups") || "{}");
    if (newFieldGroups[fieldGroupId]) {
        const fieldGroup = newFieldGroups[fieldGroupId];
        console.log("Loading field group from sessionStorage:", fieldGroup);
        const fields = Object.entries(fieldGroup.fields || {}).map(([id, field]) => `
            <li class="custom-list-item" data-id="${id}">${field.name}</li>
        `).join('') || '<li class="custom-list-item">No fields yet</li>';
        divE.innerHTML = `
            <h3>Field Group Name</h3>
            <input type="text" value="${fieldGroup.name}">
            <h4>Field Group Description</h4>
            <textarea>${fieldGroup.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${fieldGroup.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Fields</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldList">${fields}</ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                <img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">
                <button>Upload Icon</button>
            </div>
            <h4>Field Group Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheckFieldGroup" ${fieldGroup.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheckFieldGroup" style="color: #000000; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheckFieldGroup" ${fieldGroup.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheckFieldGroup" style="color: #000000; font-size: 14px;">Reserved</label>
                </div>
            </div>
        `;
        attachFieldListListeners();
        addIconBarListeners(divE.querySelector(".icon-bar"), "Field", fieldGroupId);
        return;
    }

    try {
        const fieldGroup = await fetchTableManagerItem("FieldGroup", fieldGroupId);
        const fields = await fetchTableManagerListItems("Field", fieldGroupId);
        console.log("Field Group data:", fieldGroup);
        console.log("Fields data:", fields);

        divE.innerHTML = `
            <h3>Field Group Name</h3>
            <input type="text" value="${fieldGroup.name}">
            <h4>Field Group Description</h4>
            <textarea>${fieldGroup.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${fieldGroup.visible ? 'checked' : ''}> Visible</label>
            <div class="section-title">
                <span>Fields</span>
                <div class="icon-bar">
                    <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" />
                    <img src="/assets/main-icons/add.png" alt="Add" />
                    <img src="/assets/main-icons/delete.png" alt="Delete" />
                </div>
            </div>
            <div class="list-box-container">
                <ul class="custom-list" id="fieldList">
                    ${(fields || []).map(field => `
                        <li class="custom-list-item" data-id="${field.id}">${field.name}</li>
                    `).join('') || '<li class="custom-list-item">No fields yet</li>'}
                </ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                ${fieldGroup.icon && fieldGroup.icon.base64 ? `<img src="${fieldGroup.icon.base64}" alt="Field Group Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Field Group Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheckFieldGroup" ${fieldGroup.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheckFieldGroup" style="color: #000000; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheckFieldGroup" ${fieldGroup.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheckFieldGroup" style="color: #000000; font-size: 14px;">Reserved</label>
                </div>
            </div>
        `;

        attachFieldListListeners();
        addIconBarListeners(divE.querySelector(".icon-bar"), "Field", fieldGroupId);

        if (cascade && fields && fields.length > 0) {
            const firstField = fields[0];
            const fieldItems = divE.querySelectorAll("#fieldList .custom-list-item");
            fieldItems.forEach(item => item.classList.remove("selected"));
            const firstFieldItem = Array.from(fieldItems).find(item => item.dataset.id === firstField.id.toString());
            if (firstFieldItem) {
                firstFieldItem.classList.add("selected");
                await loadFieldDetails(firstField.id);
            }
        }
    } catch (error) {
        console.error("Error in loadFieldGroupDetails:", error);
        divE.innerHTML = '<h3>Failed to load Field Group details</h3>';
    }
}
// Load field details
async function loadFieldDetails(fieldId) {
    console.log(`Loading field details for ID: ${fieldId}`);
    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");

    if (!divC || !divD || !divE || !divF || !divG) {
        console.error("One or more detail divs not found");
        return;
    }

    divF.style.display = "block";
    divG.style.display = "block";
    divE.style.display = "block";
    divD.style.display = "block";
    divC.style.display = "block";

    const newFields = JSON.parse(sessionStorage.getItem("newFields") || "{}");
    if (newFields[fieldId]) {
        const field = newFields[fieldId];
        console.log("Loading field from sessionStorage:", field);
        divF.innerHTML = `
            <h3 style="color: #ffffff; margin-bottom: 15px;">Field Name</h3>
            <input type="text" value="${field.name}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Description</h4>
            <textarea style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: vertical;">${field.description || ''}</textarea>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Status</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="visibleCheck" ${field.visible ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="visibleCheck" style="color: #ffffff; font-size: 14px;">Visible</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data Type</h4>
            <select class="field-data-type" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
                <option value="string" ${field.dataType === "string" ? "selected" : ""}>String</option>
                <option value="number" ${field.dataType === "number" ? "selected" : ""}>Number</option>
                <option value="boolean" ${field.dataType === "boolean" ? "selected" : ""}>Boolean</option>
                <option value="date" ${field.dataType === "date" ? "selected" : ""}>Date</option>
            </select>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data SubType</h4>
            <input type="text" class="field-data-subtype" value="${field.dataSubType || ''}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Icon</h4>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <img src="/assets/main-icons/home.png" alt="Field Icon" style="width: 24px; height: 24px;">
                <button style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Upload Icon</button>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheck" ${field.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheck" style="color: #ffffff; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheck" ${field.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheck" style="color: #ffffff; font-size: 14px;">Reserved</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="compulsoryCheck" ${field.features?.compulsory ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="compulsoryCheck" style="color: #ffffff; font-size: 14px;">Compulsory</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="labelCheck" ${field.features?.label ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="labelCheck" style="color: #ffffff; font-size: 14px;">Label</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fullTextCheck" ${field.features?.fullTextIndexed ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fullTextCheck" style="color: #ffffff; font-size: 14px;">Full text indexed (if text)</label>
                </div>
            </div>
            <button class="save-field-btn" style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Save</button>
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
        divF.querySelector(".save-field-btn").addEventListener("click", async () => {
            const updatedField = {
                name: divF.querySelector("input[type='text']").value,
                description: divF.querySelector("textarea").value,
                visible: divF.querySelector("#visibleCheck").checked,
                dataType: divF.querySelector(".field-data-type").value,
                dataSubType: divF.querySelector(".field-data-subtype").value,
                parentId: field.parentId,
                properties: {
                    readOnly: divF.querySelector("#readOnlyCheck").checked,
                    reserved: divF.querySelector("#reservedCheck").checked
                },
                features: {
                    compulsory: divF.querySelector("#compulsoryCheck").checked,
                    label: divF.querySelector("#labelCheck").checked,
                    fullTextIndexed: divF.querySelector("#fullTextCheck").checked
                },
                icon: { alternativeText: "Field Icon" }
            };
            await setTableManagerItem("Field", fieldId, updatedField);
            delete newFields[fieldId];
            sessionStorage.setItem("newFields", JSON.stringify(newFields));
            await loadFieldGroupDetails(field.parentId);
        });
        return;
    }

    try {
        const field = await fetchTableManagerItem("Field", fieldId);
        console.log("Field data:", field);

        divF.innerHTML = `
            <h3 style="color: #ffffff; margin-bottom: 15px;">Field Name</h3>
            <input type="text" value="${field.name || 'Unnamed'}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Description</h4>
            <textarea style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: vertical;">${field.description || ''}</textarea>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Status</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="visibleCheck" ${field.visible ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="visibleCheck" style="color: #ffffff; font-size: 14px;">Visible</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data Type</h4>
            <select class="field-data-type" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
                <option value="string" ${field.dataType === "string" ? "selected" : ""}>String</option>
                <option value="number" ${field.dataType === "number" ? "selected" : ""}>Number</option>
                <option value="boolean" ${field.dataType === "boolean" ? "selected" : ""}>Boolean</option>
                <option value="date" ${field.dataType === "date" ? "selected" : ""}>Date</option>
            </select>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data SubType</h4>
            <input type="text" class="field-data-subtype" value="${field.dataSubType || ''}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Icon</h4>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <img src="${field.icon && field.icon.base64 ? field.icon.base64 : '/assets/main-icons/home.png'}" alt="Field Icon" style="width: 24px; height: 24px;">
                <button style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Upload Icon</button>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Properties</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="readOnlyCheck" ${field.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="readOnlyCheck" style="color: #ffffff; font-size: 14px;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheck" ${field.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="reservedCheck" style="color: #ffffff; font-size: 14px;">Reserved</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="compulsoryCheck" ${field.features?.compulsory ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="compulsoryCheck" style="color: #ffffff; font-size: 14px;">Compulsory</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="labelCheck" ${field.features?.label ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="labelCheck" style="color: #ffffff; font-size: 14px;">Label</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fullTextCheck" ${field.features?.fullTextIndexed ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="fullTextCheck" style="color: #ffffff; font-size: 14px;">Full text indexed (if text)</label>
                </div>
            </div>
            <button class="save-field-btn" style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Save</button>
        `;

        divF.querySelector(".save-field-btn").addEventListener("click", async () => {
            const updatedField = {
                ...field,
                name: divF.querySelector("input[type='text']").value,
                description: divF.querySelector("textarea").value,
                visible: divF.querySelector("#visibleCheck").checked,
                dataType: divF.querySelector(".field-data-type").value,
                dataSubType: divF.querySelector(".field-data-subtype").value,
                properties: {
                    readOnly: divF.querySelector("#readOnlyCheck").checked,
                    reserved: divF.querySelector("#reservedCheck").checked
                },
                features: {
                    compulsory: divF.querySelector("#compulsoryCheck").checked,
                    label: divF.querySelector("#labelCheck").checked,
                    fullTextIndexed: divF.querySelector("#fullTextCheck").checked
                }
            };
            await setTableManagerItem("Field", fieldId, updatedField);
            await loadFieldGroupDetails(field.parentId);
        });

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

        divG.querySelectorAll("img[alt='Settings']").forEach(icon => {
            icon.addEventListener("click", () => {
                const settingType = icon.parentElement.querySelector("span").textContent;
                console.log(`Settings icon clicked for: ${settingType}`);
                openSettings(settingType);
            });
        });
    } catch (error) {
        console.error("Error in loadFieldDetails:", error);
        divF.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field details</h3>';
        divG.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field settings</h3>';
    }
}

// Sort items alphabetically in the UI
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
    if (items.length === 0 || (items.length === 1 && items[0].textContent === `No ${type.toLowerCase()}s yet`)) {
        console.log("No items to sort");
        return;
    }

    items.sort((a, b) => a.textContent.localeCompare(b.textContent));
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

    console.log(`Successfully sorted ${type} items alphabetically`);
}

// Delete an item and its associated UI elements
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
    const storageKey = `new${type}s`;
    const newItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    if (newItems[itemId]) {
        delete newItems[itemId];
        sessionStorage.setItem(storageKey, JSON.stringify(newItems));
    }

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
        list.innerHTML = `<li class="custom-list-item">No ${type.toLowerCase()}s yet</li>`;
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

// Helper function for cascading deletes
function deleteCascadingData(type, itemId) {
    console.log(`Cascading delete - Type: ${type}, ID: ${itemId}`);
    const listId = type === "Table" ? "tableList" :
        type === "FieldGroup" ? "fieldGroupList" :
            "fieldList";
    const storageKey = `new${type}s`;
    const newItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    if (newItems[itemId]) {
        delete newItems[itemId];
        sessionStorage.setItem(storageKey, JSON.stringify(newItems));
    }

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

        if (list.children.length === 0) {
            list.innerHTML = `<li class="custom-list-item">No ${type.toLowerCase()}s yet</li>`;
        }
    }
}

// Add a new item to the list and store in sessionStorage with children
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
        const tempId = Math.max(...items.map(i => parseInt(i.id)), 0) + 1; // Temporary ID

        const newItemHtml = `<li class="custom-list-item" data-id="${tempId}">
            <input type="text" class="new-item-input" placeholder="Enter ${type.toLowerCase()} name" style="width: 100%; padding: 5px; border: none; background: transparent;">
        </li>`;

        // Check if the list has a "No * yet" or similar placeholder and replace it
        const placeholderTexts = [
            `No ${type.toLowerCase()}s yet`,
            `No ${type.toLowerCase()}s`,
            "No items"
        ];
        const hasPlaceholder = Array.from(list.children).some(child =>
            placeholderTexts.includes(child.textContent.trim())
        );

        if (hasPlaceholder) {
            list.innerHTML = newItemHtml; // Replace the placeholder
        } else {
            list.insertAdjacentHTML('beforeend', newItemHtml); // Append if not a placeholder
        }

        const newInput = list.querySelector(`.new-item-input`);
        newInput.focus();

        newInput.addEventListener("keypress", async (e) => {
            if (e.key === "Enter" && newInput.value.trim() !== "") {
                const newItem = {
                    name: newInput.value.trim(),
                    description: "",
                    visible: true,
                    sortIndex: items.length,
                    parentId: parentId || 0,
                    icon: { alternativeText: `${type} Icon` }
                };

                if (type === "Table") {
                    newItem.systemProperties = { clearance: false };
                    newItem.fieldGroups = {};
                } else if (type === "FieldGroup") {
                    newItem.fields = {};
                } else if (type === "Field") {
                    newItem.dataType = "string";
                    newItem.dataSubType = "";
                    newItem.properties = { readOnly: false, reserved: false };
                    newItem.features = { compulsory: false, label: true, fullTextIndexed: false };
                } else if (type === "Area") {
                    newItem.tables = {};
                }

                const newLi = document.createElement("li");
                newLi.className = "custom-list-item";
                newLi.dataset.id = tempId;
                newLi.textContent = newItem.name;
                newInput.parentElement.replaceWith(newLi);

                newLi.classList.add("selected");

                const storageKey = `new${type}s`;
                const newItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
                newItems[tempId] = newItem;
                sessionStorage.setItem(storageKey, JSON.stringify(newItems));

                if (parentId) {
                    const parentStorageKey = type === "Table" ? "newAreas" :
                        type === "FieldGroup" ? "newTables" :
                            type === "Field" ? "newFieldGroups" : null;
                    if (parentStorageKey) {
                        const parentItems = JSON.parse(sessionStorage.getItem(parentStorageKey) || "{}");
                        if (parentItems[parentId]) {
                            const childKey = type === "Table" ? "tables" :
                                type === "FieldGroup" ? "fieldGroups" :
                                    "fields";
                            parentItems[parentId][childKey][tempId] = newItem;
                            sessionStorage.setItem(parentStorageKey, JSON.stringify(parentItems));
                        }
                    }
                }

                if (type === "Area") {
                    attachAreaListListeners();
                    await loadAreaDetails(tempId);
                } else if (type === "Table") {
                    attachTableListListeners();
                    await loadTableDetails(tempId);
                } else if (type === "FieldGroup") {
                    attachFieldGroupListListeners();
                    await loadFieldGroupDetails(tempId);
                } else if (type === "Field") {
                    attachFieldListListeners();
                    await loadFieldDetails(tempId);
                }

                console.log(`Successfully added new ${type} item with ID: ${tempId} and stored in sessionStorage`);
            }
        });

        newInput.addEventListener("blur", () => {
            if (newInput.value.trim() === "") {
                newInput.parentElement.remove();
                if (list.children.length === 0) {
                    list.innerHTML = `<li class="custom-list-item">No ${type.toLowerCase()}s yet</li>`;
                }
            }
        });
    } catch (error) {
        console.error(`Error in addItem (${type}):`, error);
        list.innerHTML = `<li class="custom-list-item error">Failed to add ${type}</li>`;
    }
}

// Helper function to add icon bar listeners
function addIconBarListeners(iconBar, type, parentId) {
    console.log(`Adding event listeners to ${type} icon bar`);
    iconBar.children[0].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (up)`);
        await sortItemsAlphabetically(type, parentId);
    });
    iconBar.children[1].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (down)`);
        await sortItemsAlphabetically(type, parentId);
    });
    iconBar.children[2].addEventListener("click", async () => {
        console.log(`Add clicked for ${type}`);
        await addItem(type, parentId);
    });
    iconBar.children[3].addEventListener("click", async () => {
        console.log(`Delete clicked for ${type}`);
        await deleteItem(type, parentId);
    });
}

// Attach click listeners to area list items
function attachAreaListListeners() {
    const items = document.querySelectorAll("#areaList .custom-list-item");
    if (!items.length) {
        console.log("No items found in #areaList to attach listeners to");
        return;
    }
    items.forEach(item => {
        item.addEventListener("click", async (e) => {
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 100)); // Debounce
            console.log(`Area clicked: ${item.dataset.id}`);
            items.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const areaId = item.dataset.id;
            if (!areaId) {
                console.error("No areaId found for clicked item:", item);
                return;
            }
            await loadAreaDetails(areaId);
        });
    });
}

// Attach click listeners to table list items
function attachTableListListeners() {
    const items = document.querySelectorAll("#tableList .custom-list-item");
    if (!items.length) {
        console.log("No items found in #tableList to attach listeners to");
        return;
    }
    items.forEach(item => {
        item.addEventListener("click", async (e) => {
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 100)); // Debounce
            console.log(`Table clicked: ${item.dataset.id}`);
            items.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const tableId = item.dataset.id;
            await loadTableDetails(tableId);
        });
    });
}

// Attach click listeners to field group list items
function attachFieldGroupListListeners() {
    const items = document.querySelectorAll("#fieldGroupList .custom-list-item");
    if (!items.length) {
        console.log("No items found in #fieldGroupList to attach listeners to");
        return;
    }
    items.forEach(item => {
        item.addEventListener("click", async (e) => {
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 100)); // Debounce
            console.log(`Field Group clicked: ${item.dataset.id}`);
            items.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const fieldGroupId = item.dataset.id;
            await loadFieldGroupDetails(fieldGroupId);
        });
    });
}

// Attach click listeners to field list items
function attachFieldListListeners() {
    const items = document.querySelectorAll("#fieldList .custom-list-item");
    if (!items.length) {
        console.log("No items found in #fieldList to attach listeners to");
        return;
    }
    items.forEach(item => {
        item.addEventListener("click", async (e) => {
            e.preventDefault();
            await new Promise(resolve => setTimeout(resolve, 100)); // Debounce
            console.log(`Field clicked: ${item.dataset.id}`);
            items.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const fieldId = item.dataset.id;
            await loadFieldDetails(fieldId);
        });
    });
}

// Placeholder function for opening settings
function openSettings(settingType) {
    console.log(`Opening settings for: ${settingType}`);
    // Implement settings logic here if needed
}

// Load the sidebar menu
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


// Logout popup handling
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

function setupUniversalVisibilityToggle() {
    document.addEventListener("change", (e) => {
        const checkbox = e.target;

        if (!checkbox.matches('input[type="checkbox"]')) return;

        const label = checkbox.closest("label");
        if (!label || !label.textContent.toLowerCase().includes("visible")) return;

        const section = checkbox.closest(".field-settings, .area-details, .table-details, .field-details");
        if (!section) {
            console.warn("[⚠️ Visibility Toggle] No section found for visibility toggle.");
            return;
        }

        const listBox = section.querySelector(".list-box-container");
        const dataTypeRow = section.querySelector(".field-data-type")?.closest("div");
        const dataSubTypeRow = section.querySelector(".field-data-subtype")?.closest("div");

        const show = checkbox.checked;

        if (listBox) listBox.style.display = show ? "block" : "none";
        if (dataTypeRow) dataTypeRow.style.display = show ? "flex" : "none";
        if (dataSubTypeRow) dataSubTypeRow.style.display = show ? "flex" : "none";

        console.log(`[✅ Visibility Toggle] Toggled visibility: ${show}`);
    });
}





// Run on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    setupUniversalVisibilityToggle();
});


// Universal visibility checkbox handler
document.addEventListener("change", function (event) {
    // Check if the changed element is a checkbox with id="visibleCheck"
    if (event.target.matches('input[type="checkbox"]#visibleCheck')) {
        const isChecked = event.target.checked;
        //alert(`Visibility toggled to: ${isChecked ? "Visible" : "Hidden"}`);
        console.log(`Visibility checkbox changed to: ${isChecked}`);

        // Find the closest field-settings container
        const fieldSettings = event.target.closest('.field-settings');
        if (!fieldSettings) {
            console.error("Field settings container not found");
            return;
        }

        // Find the field-data-type select and field-data-subtype input
        const dataTypeSelect = fieldSettings.querySelector('.field-data-type');
        const dataSubTypeInput = fieldSettings.querySelector('.field-data-subtype');

        // Toggle their visibility
        if (dataTypeSelect) {
            dataTypeSelect.style.display = isChecked ? 'block' : 'none';
            console.log(`Field data type visibility set to: ${isChecked ? 'block' : 'none'}`);
        } else {
            console.warn("Field data type select not found");
        }

        if (dataSubTypeInput) {
            dataSubTypeInput.style.display = isChecked ? 'block' : 'none';
            console.log(`Field data subtype visibility set to: ${isChecked ? 'block' : 'none'}`);
        } else {
            console.warn("Field data subtype input not found");
        }
    }
});

// Log when the listener is set up
console.log("Universal visibility checkbox listener initialized");

// Universal visibility checkbox handler
document.addEventListener("change", function (event) {
    if (event.target.matches('input[type="checkbox"]#visibleCheck')) {
        const isChecked = event.target.checked;
        alert(`Visibility toggled to: ${isChecked ? "Visible" : "Hidden"}`);
        console.log(`Visibility checkbox changed to: ${isChecked}`);

        const fieldSettings = event.target.closest('.field-settings');
        if (!fieldSettings) return;

        const dataTypeSelect = fieldSettings.querySelector('.field-data-type');
        const dataSubTypeInput = fieldSettings.querySelector('.field-data-subtype');

        if (dataTypeSelect) dataTypeSelect.style.display = isChecked ? 'block' : 'none';
        if (dataSubTypeInput) dataSubTypeInput.style.display = isChecked ? 'block' : 'none';
    }
});

/// Universal undo function for new additions
function setupUniversalUndo() {
    let lastAddedItem = null; // Store the last added item details

    // Define the lists to observe
    const listsToWatch = [
        { id: 'areaList', type: 'Area' },
        { id: 'tableList', type: 'Table' },
        { id: 'fieldGroupList', type: 'FieldGroup' },
        { id: 'fieldList', type: 'Field' }
    ];

    // Set up MutationObserver to watch for new items
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.custom-list-item')) {
                        const list = node.closest('.custom-list');
                        if (!list) {
                            console.warn("No custom-list parent found for added item");
                            return;
                        }

                        const listId = list.id;
                        const listConfig = listsToWatch.find(l => l.id === listId);
                        if (!listConfig) {
                            console.warn(`List ${listId} not in watched lists`);
                            return;
                        }

                        const itemId = node.dataset.id;
                        const itemName = node.querySelector('.item-name')?.textContent ||
                            node.querySelector('input')?.value ||
                            node.textContent.trim();

                        if (!itemId || !itemName) {
                            console.warn(`New item in ${listId} missing id (${itemId}) or name (${itemName}):`, node);
                            return;
                        }

                        lastAddedItem = {
                            type: listConfig.type,
                            id: itemId,
                            listId: listId,
                            name: itemName,
                            element: node // Store the exact DOM element
                        };
                        console.log(`Captured new ${listConfig.type} addition: ID=${itemId}, Name=${itemName}, List=${listId}`);
                    }
                });
            }
        });
    });

    // Start observing each list
    listsToWatch.forEach(({ id }) => {
        const list = document.getElementById(id);
        if (list) {
            observer.observe(list, { childList: true, subtree: true });
            console.log(`Observing ${id} for new items`);
        } else {
            console.warn(`List ${id} not found in DOM on initialization`);
        }
    });

    // Attach undo functionality to the undoIcon
    document.addEventListener("click", function (event) {
        if (event.target.matches('#undoIcon')) {
            console.log("Undo icon clicked, current lastAddedItem:", lastAddedItem);
            undoLastAddition();
        }
    });

    // Core undo function
    function undoLastAddition() {
        if (!lastAddedItem) {
            console.log("Nothing to undo - lastAddedItem is null");
            alert("Nothing to undo");
            return;
        }

        const { type, id, listId, name, element } = lastAddedItem;
        const storageKey = `new${type}s`;

        console.log(`Attempting to undo ${type}: ID=${id}, Name=${name}, List=${listId}`);

        // Remove only the specific item from the DOM list
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            console.log(`Successfully removed ${type} ID=${id} from DOM list (${listId})`);
        } else {
            console.warn(`Failed to remove ${type} ID=${id} - element not found or already removed`);
        }

        // Remove from sessionStorage
        const newItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
        if (newItems[id]) {
            delete newItems[id];
            sessionStorage.setItem(storageKey, JSON.stringify(newItems));
            console.log(`Removed ${type} ID=${id} from sessionStorage (${storageKey})`);
        } else {
            console.warn(`Item ID=${id} not found in sessionStorage (${storageKey})`);
        }

        // Remove from parent if applicable
        const parentStorageMap = {
            'Table': 'newAreas',
            'FieldGroup': 'newTables',
            'Field': 'newFieldGroups'
        };
        const parentStorageKey = parentStorageMap[type];
        if (parentStorageKey) {
            const parentItems = JSON.parse(sessionStorage.getItem(parentStorageKey) || "{}");
            let removedFromParent = false;
            for (const parentId in parentItems) {
                const childKey = type === 'Table' ? 'tables' :
                    type === 'FieldGroup' ? 'fieldGroups' : 'fields';
                if (parentItems[parentId][childKey] && parentItems[parentId][childKey][id]) {
                    delete parentItems[parentId][childKey][id];
                    sessionStorage.setItem(parentStorageKey, JSON.stringify(parentItems));
                    console.log(`Removed ${type} ID=${id} from parent in ${parentStorageKey}`);
                    removedFromParent = true;
                    break;
                }
            }
            if (!removedFromParent) {
                console.warn(`No parent reference found for ${type} ID=${id} in ${parentStorageKey}`);
            }
        }

        alert(`Undid addition of ${type}: ${name}`);
        lastAddedItem = null; // Reset after undoing
    }

    console.log("Universal undo function initialized with MutationObserver");
}





// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, initializing menu");
    loadMenu();
});