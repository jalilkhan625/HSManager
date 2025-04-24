﻿const token = document.getElementById("token").value;
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

            });
            areaIconBar.children[1].addEventListener("click", async () => {
                console.log("Sort alphabetically clicked for Areas (down)");

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
        <div class="icon-bar" style="display: flex; gap: 10px;">
            <img src="/assets/main-icons/move-up.png" alt="Sort Alphabetically" style="width: 24px; height: 24px;" />
            <img src="/assets/main-icons/move-down.png" alt="Sort Alphabetically" style="width: 24px; height: 24px;" />
            <img src="/assets/main-icons/add.png" alt="Add" style="width: 24px; height: 24px;" />
            <img src="/assets/main-icons/delete.png" alt="Delete" style="width: 24px; height: 24px;" />
        </div>
    </div>
            <div class="list-box-container">
                <ul class="custom-list" id="tableList">${tables}</ul>
            </div>
            <h4 class="area-icon-head">Area Icon</h4>
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
        `).join('');
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
            <h4>Table Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="clearanceCheckTable" ${table.systemProperties?.clearance ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="clearanceCheckTable" style="color: #000000; font-size: 14px;">Clearance</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="timelineCheckTable" ${table.systemProperties?.timeline ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="timelineCheckTable" style="color: #000000; font-size: 14px;">Timeline</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="freezingCheckTable" ${table.systemProperties?.freezing ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="freezingCheckTable" style="color: #000000; font-size: 14px;">Freezing</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="versioningCheckTable" ${table.systemProperties?.versioning ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="versioningCheckTable" style="color: #000000; font-size: 14px;">Versioning</label>
                </div>
            </div>
            <h4>Table Relations</h4>
            <div class="list-box-container">
                <ul class="custom-list" id="tableRelationsList">
                    <li class="custom-list-item">No relations yet</li>
                </ul>
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
            <h4>Table Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="clearanceCheckTable" ${table.systemProperties?.clearance ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="clearanceCheckTable" style="color: #000000; font-size: 14px;">Clearance</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="timelineCheckTable" ${table.systemProperties?.timeline ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="timelineCheckTable" style="color: #000000; font-size: 14px;">Timeline</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="freezingCheckTable" ${table.systemProperties?.freezing ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="freezingCheckTable" style="color: #000000; font-size: 14px;">Freezing</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="versioningCheckTable" ${table.systemProperties?.versioning ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: #ccc;">
                    <label for="versioningCheckTable" style="color: #000000; font-size: 14px;">Versioning</label>
                </div>
            </div>
            <h4>Table Relations</h4>
            <div class="list-box-container">
                <ul class="custom-list" id="tableRelationsList">
                    <li class="custom-list-item">No relations yet</li>
                </ul>
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
    let field;

    if (newFields[fieldId]) {
        field = newFields[fieldId];
        console.log("Loading field from sessionStorage:", field);
    } else {
        try {
            field = await fetchTableManagerItem("Field", fieldId);
            console.log("Field data:", field);
        } catch (error) {
            console.error("Error in loadFieldDetails:", error);
            divF.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field details</h3>';
            divG.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field settings</h3>';
            return;
        }
    }

    // Standardize the HTML with <textarea> for Field Name
    divF.innerHTML = `
    <h3 style="color: #ffffff; margin-bottom: 15px;">Field Name</h3>
    <input type="text" value="${field.name || 'Unnamed'}" style="width: 100%; height: 35px; padding: 5px; margin-top: -5px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; line-height: 16px; font-size: 16px;">
    <h4 style="color: #ffffff; margin-top: 15px;">Field Description</h4>
   <textarea style="width: 100%; height: 60px; padding: 5px; margin-top: 0px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: none; line-height: 16px; font-size: 16px;">${field.description || ''}</textarea>
    <h4 style="color: #ffffff; margin-top: 15px;">Status</h4>
<div class="checkbox-group" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
<div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
        <input type="checkbox" id="visibleCheck" checked style="width: 12px; height: 12px; margin-right: 8px; accent-color: grey; margin-top: 8px;">
        <label for="visibleCheck" style="color: #ffffff; font-size: 16px; font-weight: normal;">Visible</label>
</div>
</div>
</div>
    <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data Type</h4>
    <select class="field-data-type" style="width: 100%; padding: 5px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; height: 26px; line-height: 16px; font-size: 14px;">
        <option value="string" style="color: black; background-color: white;" ${field.dataType === "string" ? "selected" : ""}>String</option>
        <option value="number" style="color: black; background-color: white;" ${field.dataType === "number" ? "selected" : ""}>Number</option>
        <option value="boolean" style="color: black; background-color: white;" ${field.dataType === "boolean" ? "selected" : ""}>Boolean</option>
        <option value="date" style="color: black; background-color: white;" ${field.dataType === "date" ? "selected" : ""}>Date</option>
    </select>
    <h4 style="color: #ffffff; margin-bottom: 10px;">Field Data SubType</h4>
    <select class="field-data-subtype" style="width: 100%; padding: 5px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; height: 26px; line-height: 16px; font-size: 14px;">
        <option value="" style="color: black; background-color: white;" ${!field.dataSubType ? "selected" : ""}>None</option>
        <option value="text" style="color: black; background-color: white;" ${field.dataSubType === "text" ? "selected" : ""}>Text</option>
        <option value="email" style="color: black; background-color: white;" ${field.dataSubType === "email" ? "selected" : ""}>Email</option>
        <option value="url" style="color: black; background-color: white;" ${field.dataSubType === "url" ? "selected" : ""}>URL</option>
        <option value="integer" style="color: black; background-color: white;" ${field.dataSubType === "integer" ? "selected" : ""}>Integer</option>
        <option value="decimal" style="color: black; background-color: white;" ${field.dataSubType === "decimal" ? "selected" : ""}>Decimal</option>
        <option value="datetime" style="color: black; background-color: white;" ${field.dataSubType === "datetime" ? "selected" : ""}>DateTime</option>
    </select>
    <h4 style="color: #ffffff; margin-bottom: 10px;">Field Icon</h4>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
        <img src="${field.icon && field.icon.base64 ? field.icon.base64 : '/assets/main-icons/home.png'}" alt="Field Icon" style="width: 24px; height: 24px;">
        <button style="font-size: 14px; padding: 5px 10px; border-radius: 0; background-color: #555; color: #ffffff; border: none; cursor: pointer;">Upload Icon</button>
    </div>
    <h4 style="color: #ffffff; margin-bottom: 10px;">Field Properties</h4>
<div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
    <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
        <input type="checkbox" id="readOnlyCheck" ${field.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: white;">
        <label for="readOnlyCheck" style="color: #ffffff; font-size: 14px; font-weight: normal;">Read only</label>
    </div>
    <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
        <input type="checkbox" id="reservedCheck" ${field.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: white;">
        <label for="reservedCheck" style="color: #ffffff; font-size: 14px; font-weight: normal;">Reserved</label>
    </div>
</div>
    </div>
    <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
            <input type="checkbox" id="compulsoryCheck" ${field.features?.compulsory ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: white;">
            <label for="compulsoryCheck" style="color: #ffffff; font-size: 14px;font-weight: normal;">Compulsory</label>
        </div>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
            <input type="checkbox" id="labelCheck" ${field.features?.label ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: white;">
            <label for="labelCheck" style="color: #ffffff; font-size: 14px;font-weight: normal;">Label</label>
        </div>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
            <input type="checkbox" id="fullTextCheck" ${field.features?.fullTextIndexed ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; accent-color: white;">
            <label for="fullTextCheck" style="color: #ffffff; font-size: 14px;font-weight: normal;">Full text indexed (if text)</label>
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

    divG.querySelectorAll("img[alt='Settings']").forEach(icon => {
        icon.addEventListener("click", () => {
            const settingType = icon.parentElement.querySelector("span").textContent;
            console.log(`Settings icon clicked for: ${settingType}`);
            openSettings(settingType);
        });
    });
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
        const newItemsKey = `new${type}s`;
        const newItems = JSON.parse(sessionStorage.getItem(newItemsKey) || "{}");

        const serverIds = items.map(item => parseInt(item.id) || 0);
        const sessionIds = Object.keys(newItems).map(id => parseInt(id) || 0);
        const allIds = [...serverIds, ...sessionIds];

        const defaultStartingIds = {
            "Area": 1,
            "Table": 101,
            "FieldGroup": 1001,
            "Field": 10001
        };
        const startingId = defaultStartingIds[type];

        const maxId = allIds.length > 0 ? Math.max(...allIds) : startingId - 1;
        const newId = maxId + 1;
        console.log(`Generated new ID for ${type}: ${newId} (Max ID: ${maxId}, Starting ID: ${startingId})`);

        const newItemHtml = `<li class="custom-list-item" data-id="${newId}">
            <input type="text" class="new-item-input" placeholder="Enter ${type.toLowerCase()} name" style="width: 100%; padding: 5px; border: none; background: transparent;">
        </li>`;

        const placeholderTexts = [
            `No ${type.toLowerCase()}s yet`,
            `No ${type.toLowerCase()}s`,
            "No items"
        ];
        const hasPlaceholder = Array.from(list.children).some(child =>
            placeholderTexts.includes(child.textContent.trim())
        );

        if (hasPlaceholder) {
            list.innerHTML = newItemHtml;
        } else {
            list.insertAdjacentHTML('beforeend', newItemHtml);
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
                    newItem.systemProperties = {
                        clearance: false,
                        timeline: false,
                        freezing: false,
                        versioning: false
                    };
                    newItem.properties = {
                        readOnly: false,
                        reserved: false,
                        settingDataTable: false
                    };
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
                newLi.dataset.id = newId;
                newLi.textContent = newItem.name;
                newInput.parentElement.replaceWith(newLi);

                newLi.classList.add("selected");

                const storageKey = `new${type}s`;
                const updatedNewItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
                updatedNewItems[newId] = newItem;
                sessionStorage.setItem(storageKey, JSON.stringify(updatedNewItems));

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
                            parentItems[parentId][childKey][newId] = newItem;
                            sessionStorage.setItem(parentStorageKey, JSON.stringify(parentItems));
                        }
                    }
                }

                if (type === "Area") {
                    attachAreaListListeners();
                    await loadAreaDetails(newId);
                } else if (type === "Table") {
                    attachTableListListeners();
                    await loadTableDetails(newId);
                } else if (type === "FieldGroup") {
                    attachFieldGroupListListeners();
                    await loadFieldGroupDetails(newId);
                } else if (type === "Field") {
                    attachFieldListListeners();
                    await loadFieldDetails(newId);
                }

                console.log(`Successfully added new ${type} item with ID: ${newId} and stored in sessionStorage`);
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
        list.innerHTML = `<li class="custom-list-item error">Failed to add ${type}: ${error.message}</li>`;
    }
}

// Helper function to add icon bar listeners
function addIconBarListeners(iconBar, type, parentId) {
    console.log(`Adding event listeners to ${type} icon bar`);
    iconBar.children[0].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (up)`);

    });
    iconBar.children[1].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (down)`);

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

            // Remove 'selected' class from all items and add it to the clicked item
            items.forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");

            // Show an alert when an area is clicked
            const areaName = item.textContent.trim() || "Unnamed Area";
            //alert(`Area selected: ${areaName} (ID: ${item.dataset.id})`);

            // Hide all relevant divs first
            const divsToHide = [
                ".area-details",
                ".table-details",
                ".field-details",
                ".field-settings",
                ".field-settings-details"
            ];
            divsToHide.forEach(selector => {
                const div = document.querySelector(selector);
                if (div) {
                    div.style.display = "none";
                    console.log(`Hid div: ${selector}`);
                } else {
                    console.warn(`Div not found: ${selector}`);
                }
            });

            // Specifically target and hide the "Name" and "Settings" h3 sections and their content
            const sectionsToHide = [
                { parent: ".table-details", headingText: "Table Name" },
                { parent: ".field-details", headingText: "Field Group Name" },
                { parent: ".field-settings", headingText: "Field Name" },
                { parent: ".field-settings-details", headingText: "Field Settings" }
            ];

            sectionsToHide.forEach(({ parent, headingText }) => {
                const parentDiv = document.querySelector(parent);
                if (!parentDiv) {
                    console.warn(`Parent div ${parent} not found`);
                    return;
                }

                // Find the h3 with the exact text
                const headings = parentDiv.querySelectorAll("h3");
                headings.forEach(heading => {
                    if (heading.textContent.trim() === headingText) {
                        heading.style.display = "none";
                        console.log(`Hid ${headingText} heading in ${parent}`);

                        // Hide the next sibling (input or textarea)
                        let nextSibling = heading.nextElementSibling;
                        while (nextSibling && (nextSibling.tagName === "INPUT" || nextSibling.tagName === "TEXTAREA")) {
                            nextSibling.style.display = "none";
                            console.log(`Hid ${headingText} sibling (${nextSibling.tagName}) in ${parent}`);
                            nextSibling = nextSibling.nextElementSibling;
                        }
                    }
                });
            });

            // Load details for the newly selected area
            const areaId = item.dataset.id;
            if (!areaId) {
                console.error("No areaId found for clicked item:", item);
                return;
            }
            await loadAreaDetails(areaId);
        });
    });
}
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

        const floatingLabel = document.getElementById("floatingLabel");
        if (!floatingLabel) {
            console.error("Floating label not found");
            return;
        }
        // Append floatingLabel to body instead of sidebar
        document.body.appendChild(floatingLabel);

        let activeId = null;
        let hideTooltipTimeout;

        // Function to position the tooltip accurately
        const positionTooltip = (navItem, labelText) => {
            // Set content first to ensure correct dimensions
            floatingLabel.textContent = labelText;
            floatingLabel.style.display = "block"; // Make visible to get accurate dimensions

            // Use requestAnimationFrame to ensure DOM is stable
            requestAnimationFrame(() => {
                const itemRect = navItem.getBoundingClientRect();
                const floatingLabelRect = floatingLabel.getBoundingClientRect();

                // Center vertically: itemRect.top + half of nav item height - half of tooltip height
                floatingLabel.style.position = "absolute";
                floatingLabel.style.top = `${itemRect.top + (itemRect.height / 2) - (floatingLabelRect.height / 2)}px`;
                floatingLabel.style.left = `${itemRect.right + 5}px`; // Position to the right
            });
        };

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("mouseenter", (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                activeId = id;
                console.log(`Menu item hover: ${id}`);

                const navItem = e.currentTarget;

                let labelText;
                switch (id) {
                    case -1: labelText = "Home"; break;
                    case 1: labelText = "Table Manager"; break;
                    case 2: labelText = "InternalUserManager"; break;
                    case 3: labelText = "ExternalUserManager"; break;
                    default: labelText = navItem.getAttribute("title") || "Menu Item";
                }

                // Position tooltip
                positionTooltip(navItem, labelText);

                clearTimeout(hideTooltipTimeout);
            });

            link.addEventListener("mouseleave", () => {
                console.log("Menu item mouse leave");
                hideTooltipTimeout = setTimeout(() => {
                    floatingLabel.style.display = "none";
                    activeId = null;
                }, 200);
            });

            // Click event handler remains unchanged
            link.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = parseInt(e.currentTarget.dataset.id);
                console.log(`Menu item clicked: ${id}`);

                const contentArea = document.getElementById("dashboardContent");
                const tableManagerContainer = document.getElementById("tableManagerContainer");

                if (!contentArea || !tableManagerContainer) {
                    console.error("Content area or table manager container not found");
                    return;
                }

                if (id === 1) {
                    showNavbar();
                    console.log("Table Manager icon clicked, loading divs");
                    contentArea.querySelector("h1").style.display = "none";
                    contentArea.querySelector("p").style.display = "none";
                    tableManagerContainer.style.display = "flex";
                    //applyLayoutStyles();

                    //setSidebarStyles(); // Unchanged, applies sidebar styles
                    await populateAreasList();
                }
                if (id === -1) {
                    const navbar = document.getElementById('originalNavbar');
                    if (navbar) {
                        const isHidden = navbar.hidden || window.getComputedStyle(navbar).display === 'none';
                        if (!isHidden) {
                            location.reload();
                        }
                    } else {
                        console.log("Navbar with id 'originalNavbar' not found.");
                    }
                }
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

        // Handle layout shifts (resize/scroll)
        const repositionOnLayoutChange = () => {
            if (activeId !== null && floatingLabel.style.display === "block") {
                const activeLink = document.querySelector(`.nav-link[data-id="${activeId}"]`);
                if (activeLink) {
                    let labelText;
                    switch (activeId) {
                        case -1: labelText = "Home"; break;
                        case 1: labelText = "Table Manager"; break;
                        case 2: labelText = "InternalUserManager"; break;
                        case 3: labelText = "ExternalUserManager"; break;
                        default: labelText = activeLink.getAttribute("title") || "Menu Item";
                    }
                    positionTooltip(activeLink, labelText);
                }
            }
        };

        // Add event listeners for resize and scroll
        window.addEventListener("resize", repositionOnLayoutChange);
        window.addEventListener("scroll", repositionOnLayoutChange);

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



// Centralized visibility state (defined globally or passed as needed)
const visibilityState = {
    navbar: false,
    userTitle: false,
    lockIcon: false,
    undoIcon: false,
    playIcon: false,
    sidebarLogo: false,
    navbarLogo: false,
    hrElements: false,
    footer: true, // Footer starts visible
};


// Universal visibility checkbox handler
document.addEventListener("change", function (event) {
    // Check if the changed element is a checkbox with id="visibleCheck"
    if (event.target.matches('input[type="checkbox"]#visibleCheck')) {
        const isChecked = event.target.checked;
        //alert(`Visibility toggled to: ${isChecked ? "Visible" : "Hidden"}`);
        //console.log(`Visibility checkbox changed to: ${isChecked}`);

        // Find the closest field-settings container
        const fieldSettings = event.target.closest('.field-settings');
        if (!fieldSettings) {
            //console.error("Field settings container not found");
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
        //alert(`Visibility toggled to: ${isChecked ? "Visible" : "Hidden"}`);
        //console.log(`Visibility checkbox changed to: ${isChecked}`);

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



function setupIconUploadListeners() {
    // Function to attach upload listener to a button
    function attachUploadListener(button) {
        if (button.dataset.listenerAttached === "true") {
            console.log("Listener already attached to button:", button);
            return;
        }

        button.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Upload Icon button clicked in:", button.closest("div")?.className || "unknown container");

            // Create a hidden file input element
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.accept = "image/*"; // Accepts SVG, JPG, PNG, etc.
            fileInput.style.display = "none";

            // Append it to the DOM temporarily
            document.body.appendChild(fileInput);

            // Handle file selection
            fileInput.addEventListener("change", async () => {
                const file = fileInput.files[0];
                if (!file) {
                    console.log("No file selected");
                    document.body.removeChild(fileInput);
                    return;
                }

                // Validate file type
                const validTypes = ["image/svg+xml", "image/jpeg", "image/png", "image/gif"];
                if (!validTypes.includes(file.type)) {
                    console.error("Invalid file type. Please upload an SVG, JPG, PNG, or GIF.");
                    alert("Please upload a valid image file (SVG, JPG, PNG, GIF).");
                    document.body.removeChild(fileInput);
                    return;
                }

                try {
                    // Convert file to base64
                    const base64String = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error("Failed to read file"));
                        reader.readAsDataURL(file);
                    });
                    console.log("File converted to base64:", base64String.substring(0, 50) + "...");

                    // Find the closest icon container (flexible lookup)
                    let iconContainer = button.closest(".icon-upload-container");
                    if (!iconContainer) {
                        // Fallback for field-settings: use the parent flex div
                        iconContainer = button.parentElement;
                        if (iconContainer.style.display !== "flex") {
                            console.warn("No .icon-upload-container or flex parent found, preview may fail");
                        }
                    }

                    // Find or create the preview image
                    let iconPreview = iconContainer.querySelector(".icon-preview");
                    if (!iconPreview) {
                        // Fallback: look for any <img> in the container
                        iconPreview = iconContainer.querySelector("img");
                        if (iconPreview) {
                            // Add .icon-preview class for consistency
                            iconPreview.classList.add("icon-preview");
                            console.log("Added .icon-preview class to existing <img>");
                        } else {
                            console.warn("No preview image found, creating one");
                            iconPreview = document.createElement("img");
                            iconPreview.className = "icon-preview";
                            iconPreview.src = "/assets/main-icons/home.png"; // Default fallback
                            iconPreview.alt = "Default Icon";
                            iconPreview.style.width = "24px";
                            iconPreview.style.height = "24px";
                            iconContainer.insertBefore(iconPreview, button);
                        }
                    }

                    // Update the icon preview
                    iconPreview.src = base64String;
                    iconPreview.alt = `${file.name} Icon`;
                    console.log("Icon preview updated with new image in:", iconContainer.className || "flex container");

                    // Store the base64 string in sessionStorage
                    const section = button.closest(".area-details, .table-details, .field-details, .field-settings");
                    if (section) {
                        const itemType = section.classList.contains("area-details") ? "Area" :
                            section.classList.contains("table-details") ? "Table" :
                                section.classList.contains("field-details") ? "FieldGroup" :
                                    "Field";
                        const listId = itemType === "Area" ? "areaList" :
                            itemType === "Table" ? "tableList" :
                                itemType === "FieldGroup" ? "fieldGroupList" :
                                    "fieldList";
                        const selectedItem = document.querySelector(`#${listId} .custom-list-item.selected`);
                        if (selectedItem) {
                            const itemId = selectedItem.dataset.id;
                            const storageKey = `new${itemType}s`;
                            const newItems = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
                            if (newItems[itemId]) {
                                newItems[itemId].icon = { base64: base64String, alternativeText: `${file.name} Icon` };
                                sessionStorage.setItem(storageKey, JSON.stringify(newItems));
                                console.log(`Stored new icon for ${itemType} ID: ${itemId} in sessionStorage`);
                            } else {
                                console.warn(`No item with ID ${itemId} found in ${storageKey}`);
                            }
                        } else {
                            console.warn(`No selected item found in ${listId} for ${itemType}`);
                        }
                    }

                } catch (error) {
                    console.error("Error processing uploaded file:", error);
                    alert("Failed to upload icon. Please try again.");
                } finally {
                    document.body.removeChild(fileInput);
                }
            });

            // Trigger the file input click
            fileInput.click();
        });

        button.dataset.listenerAttached = "true";
        if (!button.classList.contains("upload-icon-btn")) {
            button.classList.add("upload-icon-btn");
            console.log("Added upload-icon-btn class to button:", button);
        }
    }

    // Function to identify upload buttons
    function isUploadIconButton(element) {
        return element.matches("button") &&
            (element.classList.contains("upload-icon-btn") ||
                element.textContent.trim() === "Upload Icon");
    }

    // Set up MutationObserver for dynamic buttons
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const buttons = isUploadIconButton(node) ? [node] : node.querySelectorAll("button");
                        buttons.forEach((button) => {
                            if (isUploadIconButton(button)) {
                                attachUploadListener(button);
                                console.log("Attached listener to dynamically added upload button:", button);

                                // Ensure preview exists for dynamic buttons
                                let iconContainer = button.closest(".icon-upload-container") || button.parentElement;
                                let iconPreview = iconContainer.querySelector(".icon-preview") || iconContainer.querySelector("img");
                                if (!iconPreview) {
                                    console.warn("Dynamically added button missing preview, adding one");
                                    iconPreview = document.createElement("img");
                                    iconPreview.className = "icon-preview";
                                    iconPreview.src = "/assets/main-icons/home.png";
                                    iconPreview.alt = "Default Icon";
                                    iconPreview.style.width = "24px";
                                    iconPreview.style.height = "24px";
                                    iconContainer.insertBefore(iconPreview, button);
                                } else if (!iconPreview.classList.contains("icon-preview")) {
                                    iconPreview.classList.add("icon-preview");
                                    console.log("Added .icon-preview to existing <img> for dynamic button");
                                }
                            }
                        });
                    }
                });
            }
        });
    });

    // Observe the entire document
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("MutationObserver set up to watch for new upload buttons");

    // Attach listeners to existing buttons and ensure preview
    const initialButtons = document.querySelectorAll("button");
    initialButtons.forEach((button) => {
        if (isUploadIconButton(button)) {
            attachUploadListener(button);
            let iconContainer = button.closest(".icon-upload-container") || button.parentElement;
            let iconPreview = iconContainer.querySelector(".icon-preview") || iconContainer.querySelector("img");
            if (!iconPreview) {
                console.warn("Existing button missing preview, adding one");
                iconPreview = document.createElement("img");
                iconPreview.className = "icon-preview";
                iconPreview.src = "/assets/main-icons/home.png";
                iconPreview.alt = "Default Icon";
                iconPreview.style.width = "24px";
                iconPreview.style.height = "24px";
                iconContainer.insertBefore(iconPreview, button);
            } else if (!iconPreview.classList.contains("icon-preview")) {
                iconPreview.classList.add("icon-preview");
                console.log("Added .icon-preview to existing <img> for initial button");
            }
        }
    });
    console.log("Initial upload listeners set up for", initialButtons.length, "buttons");
}

// Initialize the function
setupIconUploadListeners();


// State to track if data is locked
let isDataLocked = false;

// Function to collect and send sessionStorage data to the server
function previewSessionData() {
    try {
        const newAreas = JSON.parse(sessionStorage.getItem("newAreas") || "{}");
        const newTables = JSON.parse(sessionStorage.getItem("newTables") || "{}");
        const newFieldGroups = JSON.parse(sessionStorage.getItem("newFieldGroups") || "{}");
        const newFields = JSON.parse(sessionStorage.getItem("newFields") || "{}");

        const mappedAreas = {};

        for (const [areaId, area] of Object.entries(newAreas)) {
            mappedAreas[areaId] = {
                Id: parseInt(areaId),
                ParentId: 0,
                Name: area.name,
                Description: area.description || '',
                Visible: !!area.visible,
                SortIndex: area.sortIndex || 0,
                Icon: {
                    Base64: area.icon?.base64 || null,
                    AlternativeText: area.icon?.alternativeText || "Area Icon"
                },
                ReadOnly: !!area.properties?.readOnly,
                Reserved: !!area.properties?.reserved
            };
        }

        const mappedTables = {};
        for (const [tableId, table] of Object.entries(newTables)) {
            mappedTables[tableId] = {
                Id: parseInt(tableId),
                ParentId: parseInt(table.parentId),
                Name: table.name,
                Description: table.description || '',
                Visible: !!table.visible,
                SortIndex: table.sortIndex || 0,
                Icon: {
                    Base64: table.icon?.base64 || null,
                    AlternativeText: table.icon?.alternativeText || "Table Icon"
                },
                SystemProperties: {
                    Clearance: !!table.systemProperties?.clearance,
                    Timeline: !!table.systemProperties?.timeline,
                    Freezing: !!table.systemProperties?.freezing,
                    Versioning: !!table.systemProperties?.versioning,
                    StaticData: !!table.systemProperties?.staticData,
                    VirtualData: !!table.systemProperties?.virtualData,
                    ReadOnly: !!table.properties?.readOnly,
                    Reserved: !!table.properties?.reserved
                }
            };
        }

        const mappedFieldGroups = {};
        for (const [fgId, fg] of Object.entries(newFieldGroups)) {
            mappedFieldGroups[fgId] = {
                Id: parseInt(fgId),
                ParentId: parseInt(fg.parentId),
                Name: fg.name,
                Description: fg.description || '',
                Visible: !!fg.visible,
                SortIndex: fg.sortIndex || 0,
                Icon: {
                    Base64: fg.icon?.base64 || null,
                    AlternativeText: fg.icon?.alternativeText || "Field Group Icon"
                },
                ReadOnly: !!fg.properties?.readOnly,
                Reserved: !!fg.properties?.reserved
            };
        }

        const mappedFields = {};
        for (const [fieldId, field] of Object.entries(newFields)) {
            mappedFields[fieldId] = {
                Id: parseInt(fieldId),
                ParentId: parseInt(field.parentId),
                Name: field.name,
                Description: field.description || '',
                Visible: !!field.visible,
                SortIndex: field.sortIndex || 0,
                Icon: {
                    Base64: field.icon?.base64 || null,
                    AlternativeText: field.icon?.alternativeText || "Field Icon"
                },
                DataType: field.dataType || 'string',
                DataSubType: field.dataSubType || '',
                Properties: {
                    ReadOnly: !!field.properties?.readOnly,
                    Reserved: !!field.properties?.reserved
                },
                Features: {
                    Compulsory: !!field.features?.compulsory,
                    Label: !!field.features?.label,
                    FullTextIndexed: !!field.features?.fullTextIndexed
                }
            };
        }

        const sessionData = {
            UserId: document.getElementById("userId").value,
            Timestamp: new Date().toISOString(),
            Areas: mappedAreas,
            Tables: mappedTables,
            FieldGroups: mappedFieldGroups,
            Fields: mappedFields
        };

        console.log("📦 Structured preview (SessionData model):");
        console.log(JSON.stringify(sessionData, null, 2));
    } catch (error) {
        console.error("❌ Error generating structured preview:", error);
        alert("Failed to generate preview: " + error.message);
    }
}


function setupFinalDivSettingsIconAlert() {
    document.addEventListener("click", function (e) {
        const icon = e.target;
        const isSettingsIcon = icon.matches(".field-settings-details img[alt='Settings']");
        if (!isSettingsIcon) return;

        // Prevent default behavior
        e.preventDefault();

        // Remove any existing overlay
        const existingOverlay = document.querySelector(".settings-overlay");
        if (existingOverlay) existingOverlay.remove();

        // Create the overlay div
        const overlay = document.createElement("div");
        overlay.className = "settings-overlay";
        overlay.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%;">
                <button class="close-btn" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #fff; font-size: 18px; cursor: pointer;">×</button>
                <h4 style="margin: 0 0 10px 0">⚙️ Field Settings</h4>
                <p style="margin: 0">Configure advanced field properties here.</p>
            </div>
        `;

        // Style the overlay
        Object.assign(overlay.style, {
            position: "absolute",
            top: `${icon.getBoundingClientRect().bottom + window.scrollY + 5}px`,
            left: `${icon.getBoundingClientRect().left + window.scrollX - 300}px`, // Moved 50px to the left
            width: "250px",
            height: "150px",
            backgroundColor: "#222",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: "1000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center"
        });

        // Append overlay to the field-settings-details container
        const fieldSettingsDetails = icon.closest(".field-settings-details");
        if (fieldSettingsDetails) {
            fieldSettingsDetails.appendChild(overlay);
        } else {
            console.warn("Field settings details container not found, appending to body");
            document.body.appendChild(overlay);
        }

        // Add close functionality to the "X" button
        const closeButton = overlay.querySelector(".close-btn");
        if (closeButton) {
            closeButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent the click from bubbling up
                overlay.remove();
                console.log("Overlay closed via X button");
            });
        }

        // Close overlay when clicking outside
        const closeOnClickOutside = (ev) => {
            if (!overlay.contains(ev.target) && ev.target !== icon) {
                overlay.remove();
                document.removeEventListener("click", closeOnClickOutside);
            }
        };

        setTimeout(() => document.addEventListener("click", closeOnClickOutside), 100);

        console.log("Settings overlay displayed with close button for field-settings-details");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupFinalDivSettingsIconAlert();
});
// Universal function to sort list items in any list box
function sortListItems(listId, direction = 'asc') {
    console.log(`Sorting list items in ${listId} - Direction: ${direction}`);

    // Get the list element
    const list = document.getElementById(listId);
    if (!list) {
        console.error(`List with ID ${listId} not found`);
        return;
    }

    // Get all list items (excluding placeholders like "No items yet")
    const items = Array.from(list.querySelectorAll('.custom-list-item'))
        .filter(item => !item.textContent.match(/No.*yet|Loading...|Failed to load/i));

    if (items.length <= 1) {
        console.log(`Not enough items to sort in ${listId} (${items.length} items)`);
        return;
    }

    // Extract text content for sorting (handle inputs for new items)
    const itemData = items.map(item => {
        const input = item.querySelector('input.new-item-input');
        return {
            element: item,
            text: input ? input.value.trim() : item.textContent.trim()
        };
    });

    // Sort items based on direction
    itemData.sort((a, b) => {
        const comparison = a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
        return direction === 'asc' ? comparison : -comparison;
    });

    // Clear the list and re-append sorted items
    list.innerHTML = ''; // Temporarily clear the list
    itemData.forEach(data => list.appendChild(data.element));

    // If the list was empty before sorting, ensure it doesn't show "No items"
    if (items.length > 0 && list.children.length === 0) {
        console.warn(`List ${listId} was emptied during sorting, restoring items`);
        itemData.forEach(data => list.appendChild(data.element));
    } else if (list.children.length === 0) {
        list.innerHTML = `<li class="custom-list-item">No items yet</li>`;
    }

    // Re-attach listeners based on list type
    const listTypeMap = {
        'areaList': attachAreaListListeners,
        'tableList': attachTableListListeners,
        'fieldGroupList': attachFieldGroupListListeners,
        'fieldList': attachFieldListListeners
    };
    const reattachListeners = listTypeMap[listId];
    if (reattachListeners) {
        reattachListeners();
        console.log(`Re-attached listeners for ${listId}`);
    } else {
        console.warn(`No listener re-attachment function found for ${listId}`);
    }

    console.log(`Successfully sorted ${listId} in ${direction} order`);
}

// Update the addIconBarListeners function to use the universal sorting
function addIconBarListeners(iconBar, type, parentId) {
    console.log(`Adding event listeners to ${type} icon bar`);
    const listId = type === "Area" ? "areaList" :
        type === "Table" ? "tableList" :
            type === "FieldGroup" ? "fieldGroupList" :
                "fieldList";

    iconBar.children[0].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (up)`);
        sortListItems(listId, 'asc');
    });

    iconBar.children[1].addEventListener("click", async () => {
        console.log(`Sort alphabetically clicked for ${type} (down)`);
        sortListItems(listId, 'desc');
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

// Update populateAreasList to use the updated addIconBarListeners
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
            addIconBarListeners(areaIconBar, "Area", null); // Updated to use the universal function
        }
    } catch (error) {
        console.error("Error in populateAreasList:", error.message);
        listBox.innerHTML = `<li class="custom-list-item error">Failed to load Areas: ${error.message}</li>`;
    }
}

// Function to collect sessionStorage data and send it to the server
async function sendSessionDataToServer() {
    try {
        // Retrieve data from sessionStorage
        const newAreas = JSON.parse(sessionStorage.getItem("newAreas") || "{}");
        const newTables = JSON.parse(sessionStorage.getItem("newTables") || "{}");
        const newFieldGroups = JSON.parse(sessionStorage.getItem("newFieldGroups") || "{}");
        const newFields = JSON.parse(sessionStorage.getItem("newFields") || "{}");
        const token = document.getElementById("token").value;
        const userId = document.getElementById("userId").value;

        if (!token || !userId) {
            throw new Error("Token or UserId is missing.");
        }

        // Map data to match server-expected structure
        const sessionData = {
            UserId: userId,
            token: token, // Changed from Token to token to match controller logging
            Timestamp: new Date().toISOString(),
            Areas: {},
            Tables: {},
            FieldGroups: {},
            Fields: {}
        };

        // Map Areas
        for (const [areaId, area] of Object.entries(newAreas)) {
            sessionData.Areas[areaId] = {
                Id: parseInt(areaId),
                ParentId: area.parentId || 0,
                Name: area.name || "Unnamed",
                Description: area.description || "",
                Visible: !!area.visible,
                SortIndex: area.sortIndex || 0,
                Icon: area.icon || { Base64: null, AlternativeText: "Area Icon" },
                ReadOnly: !!area.properties?.readOnly,
                Reserved: !!area.properties?.reserved
            };
        }

        // Map Tables
        for (const [tableId, table] of Object.entries(newTables)) {
            sessionData.Tables[tableId] = {
                Id: parseInt(tableId),
                ParentId: parseInt(table.parentId) || 0,
                Name: table.name || "Unnamed",
                Description: table.description || "",
                Visible: !!table.visible,
                SortIndex: table.sortIndex || 0,
                Icon: table.icon || { Base64: null, AlternativeText: "Table Icon" },
                SystemProperties: {
                    Clearance: !!table.systemProperties?.clearance,
                    Timeline: !!table.systemProperties?.timeline,
                    Freezing: !!table.systemProperties?.freezing,
                    Versioning: !!table.systemProperties?.versioning,
                    StaticData: !!table.systemProperties?.staticData,
                    VirtualData: !!table.systemProperties?.virtualData,
                    ReadOnly: !!table.properties?.readOnly,
                    Reserved: !!table.properties?.reserved
                }
            };
        }

        // Map FieldGroups
        for (const [fgId, fg] of Object.entries(newFieldGroups)) {
            sessionData.FieldGroups[fgId] = {
                Id: parseInt(fgId),
                ParentId: parseInt(fg.parentId) || 0,
                Name: fg.name || "Unnamed",
                Description: fg.description || "",
                Visible: !!fg.visible,
                SortIndex: fg.sortIndex || 0,
                Icon: fg.icon || { Base64: null, AlternativeText: "Field Group Icon" },
                ReadOnly: !!fg.properties?.readOnly,
                Reserved: !!fg.properties?.reserved
            };
        }

        // Map Fields
        for (const [fieldId, field] of Object.entries(newFields)) {
            sessionData.Fields[fieldId] = {
                Id: parseInt(fieldId),
                ParentId: parseInt(field.parentId) || 0,
                Name: field.name || "Unnamed",
                Description: field.description || "",
                Visible: !!field.visible,
                SortIndex: field.sortIndex || 0,
                Icon: field.icon || { Base64: null, AlternativeText: "Field Icon" },
                DataType: field.dataType || "string",
                DataSubType: field.dataSubType || "",
                Properties: {
                    ReadOnly: !!field.properties?.readOnly,
                    Reserved: !!field.properties?.reserved
                },
                Features: {
                    Compulsory: !!field.features?.compulsory,
                    Label: !!field.features?.label,
                    FullTextIndexed: !!field.features?.fullTextIndexed
                }
            };
        }

        console.log("📦 Sending session data to server:", JSON.stringify(sessionData, null, 2));

        // Send data to the server using fetchWithAuth
        const response = await fetchWithAuth('/api/tablemanager/saveSessionData', 'POST', sessionData);
        console.log("✅ Server response:", response);

        // Display success message with server response
        alert(`Session data successfully sent to the server!\nServer message: ${response.message || 'Data processed'}`);

        // Optionally clear sessionStorage after successful save
        // sessionStorage.clear();
        // console.log("🧹 SessionStorage cleared after successful save");
    } catch (error) {
        console.error("❌ Error sending session data to server:", error);
        alert(`Failed to send session data: ${error.message}`);
    }
}

// Ensure the Play button triggers this function when locked
function setupLockAndPlayListeners() {
    const lockButton = document.getElementById("lockIcon");
    const playButton = document.getElementById("playIcon");

    if (!lockButton || !playButton) {
        console.error("Lock or Play button not found in the DOM");
        return;
    }

    // Lock button listener
    lockButton.addEventListener("click", () => {
        isDataLocked = !isDataLocked;
        console.log(`🔒 Data lock toggled: ${isDataLocked}`);
        alert(`Data is now ${isDataLocked ? "locked" : "unlocked"}.`);
    });

    // Play button listener
    playButton.addEventListener("click", async (e) => {
        e.preventDefault(); // Prevent navigation from <a href="#">
        console.log("▶️ Play button clicked");
        if (isDataLocked) {
            console.log("🔒 Data is locked – sending session data to server");
            await sendSessionDataToServer(); // Call the modified function
        } else {
            console.log("🔓 Data is not locked – please lock data before sending");
            alert("Please lock the data before playing.");
        }
    });

    console.log("✅ Lock and Play listeners are set up");
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    setupLockAndPlayListeners();
});


// Function to apply styles to the dropdown

function setDropdownTextColorToBlack() {
    // Function to apply black text color to dropdown elements
    const applyBlackTextColor = (element) => {
        if (element.matches('select, option, optgroup')) {
            element.style.color = 'black';
            element.style.backgroundColor = 'white'; // Ensure background contrasts with black text
        }
    };

    // Process existing dropdown elements
    document.querySelectorAll('select, option, optgroup').forEach(applyBlackTextColor);

    // Set up MutationObserver to handle dynamically added dropdowns
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node is a dropdown
                    if (node.matches('select, option, optgroup')) {
                        applyBlackTextColor(node);
                    }

                    // Check for dropdowns within the added node
                    node.querySelectorAll('select, option, optgroup').forEach(applyBlackTextColor);
                }
            });
        });
    });

    // Start observing the entire document for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Dropdown text color set to black for all existing and future dropdowns');
}

// Call the function to activate it
setDropdownTextColorToBlack();

// Universal function to show an alert with the selected area's name
function handleListItemClicks() {
    document.addEventListener("click", (e) => {
        const item = e.target.closest(".custom-list-item");
        if (item) {
            const itemId = item.dataset.id || "Unknown ID";
            const itemName = item.textContent.trim() || "Unnamed Item";
            //alert(`Item clicked: ${itemName} (ID: ${itemId})`);

            // Determine which parent container the item is in and set divs to hide accordingly
            let divsToHide = [];

            if (item.closest(".table-manager .list-box-container")) {
                divsToHide = [
                    ".table-details",
                    ".field-details",
                    ".field-settings",
                    ".field-settings-details"
                ];
            } else if (item.closest(".area-details")) {
                divsToHide = [
                    ".field-details",
                    ".field-settings",
                    ".field-settings-details"
                ];
            } else if (item.closest(".table-details")) {
                divsToHide = [
                    ".field-settings",
                    ".field-settings-details"
                ];
            }

            // Hide all specified divs
            divsToHide.forEach(selector => {
                const div = document.querySelector(selector);
                if (div) {
                    div.style.display = "none";
                    console.log(`Hid div: ${selector}`);
                } else {
                    console.warn(`Div not found: ${selector}`);
                }
            });
        }
    });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", handleListItemClicks);
function handleDynamicListItemClicks() {
    // Define container rules for hiding divs
    const containerRules = {
        ".table-manager .list-box-container": [
            ".table-details",
            ".field-details",
            ".field-settings",
            ".field-settings-details"
        ],
        ".area-details": [
            ".field-details",
            ".field-settings",
            ".field-settings-details"
        ],
        ".table-details": [
            ".field-settings",
            ".field-settings-details"
        ]
    };

    // Function to hide divs based on item location
    const hideDivsForItem = (item) => {
        let divsToHide = [];
        for (const [containerSelector, divs] of Object.entries(containerRules)) {
            if (item.closest(containerSelector)) {
                divsToHide = divs;
                break;
            }
        }
        divsToHide.forEach(selector => {
            const div = document.querySelector(selector);
            if (div) {
                div.style.display = "none";
                console.log(`Hid div: ${selector}`);
            } else {
                console.warn(`Div not found: ${selector}`);
            }
        });
    };

    // Click event delegation
    document.body.addEventListener("click", (e) => {
        const item = e.target.closest(".custom-list-item");
        if (item) {
            // Check if the item is within tableRelationsList and ignore it
            if (item.closest("#tableRelationsList")) {
                console.log("Click on tableRelationsList item ignored");
                return; // Exit early, do nothing
            }

            const itemId = item.dataset.id || "Unknown ID";
            const itemName = item.textContent.trim() || "Unnamed Item";
            // Uncomment if you want the alert back for other lists
            // alert(`Item clicked: ${itemName} (ID: ${itemId})`);
            hideDivsForItem(item);
        }
    });

    // MutationObserver for new item additions
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    const item = node.classList?.contains("custom-list-item")
                        ? node
                        : node.querySelector?.(".custom-list-item");

                    if (item && !item.closest("#tableRelationsList")) { // Exclude tableRelationsList
                        hideDivsForItem(item);
                    }
                });
            }
        });
    });

    // Observe relevant containers, excluding tableRelationsList's parent
    const containers = document.querySelectorAll(
        ".table-manager .list-box-container, .area-details, .table-details"
    );
    containers.forEach(container => {
        observer.observe(container, {
            childList: true,
            subtree: true
        });
    });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", handleDynamicListItemClicks);

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", handleDynamicListItemClicks);


function neutralizeTableRelationsListClicksCompletely() {
    console.log("🔇 Completely neutralizing clicks on tableRelationsList items");

    // Function to neutralize clicks on existing items
    const neutralizeExistingClicks = (list) => {
        if (!list) {
            console.error("tableRelationsList not found in the DOM");
            return;
        }
        // Add a direct listener to each current item
        const items = list.querySelectorAll(".custom-list-item");
        items.forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log(`Click completely neutralized on: ${item.textContent.trim()} (ID: ${item.dataset.id || "N/A"})`);
            }, { capture: true }); // Use capture phase to catch it early
        });
    };

    // Initial neutralization
    const initialList = document.getElementById("tableRelationsList");
    neutralizeExistingClicks(initialList);

    // Set up MutationObserver to handle dynamic changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check if tableRelationsList itself was added/removed
            if (mutation.type === "childList") {
                const list = document.getElementById("tableRelationsList");
                if (list && !list.dataset.neutralized) {
                    neutralizeExistingClicks(list);
                    list.dataset.neutralized = "true"; // Mark as neutralized to avoid redundant work
                    console.log("Re-neutralized tableRelationsList after DOM change");
                }

                // Check for added nodes (new items)
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const items = node.classList.contains("custom-list-item")
                            ? [node]
                            : node.querySelectorAll?.(".custom-list-item") || [];
                        items.forEach(item => {
                            if (item.closest("#tableRelationsList")) {
                                item.addEventListener("click", (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    console.log(`Click completely neutralized on dynamically added item: ${item.textContent.trim()} (ID: ${item.dataset.id || "N/A"})`);
                                }, { capture: true });
                            }
                        });
                    }
                });
            }
        });
    });

    // Observe the entire document to catch any changes to tableRelationsList
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Add a top-level document listener as a failsafe
    document.addEventListener("click", (e) => {
        const item = e.target.closest("#tableRelationsList .custom-list-item");
        if (item) {
            e.stopPropagation();
            e.preventDefault();
            console.log(`Failsafe: Click neutralized on: ${item.textContent.trim()} (ID: ${item.dataset.id || "N/A"})`);
        }
    }, { capture: true }); // Capture phase to intercept early

    console.log("✅ tableRelationsList clicks completely neutralized, including dynamic content");
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    neutralizeTableRelationsListClicksCompletely();
});


//hide navbar 
document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('originalNavbar');
    if (navbar) {
        navbar.style.display = 'none';
    }
});

//show navbar
function showNavbar() {
    const navbar = document.getElementById('originalNavbar');
    if (navbar) {
        navbar.style.display = 'block'; // or 'flex', depending on your navbar's CSS
    } else {
        console.log("Navbar with id 'originalNavbar' not found.");
    }
}


// Dynamic function to toggle elements based on input controls
function toggleElementsDynamically(config = {}) {
    // Default configuration
    const defaultConfig = {
        containerSelector: '.dynamic-container', // Parent container(s) to search within
        inputSelector: 'input[type="checkbox"]', // Default input type
        targetAttribute: 'data-listbox-id', // Attribute linking input to target element
        eventType: 'change', // Default event to listen for
        displayStyle: 'block', // Display style when visible
        observeMutations: true, // Watch for dynamically added elements
        mutationOptions: { childList: true, subtree: true } // MutationObserver options
    };

    const settings = { ...defaultConfig, ...config };

    // Helper to toggle target element visibility
    const toggleTargetElement = (inputElement) => {
        const targetId = inputElement.getAttribute(settings.targetAttribute);
        const targetElement = targetId ? document.getElementById(targetId) : null;

        if (targetElement) {
            targetElement.style.display = inputElement.checked ? settings.displayStyle : 'none';
        } else {
            console.warn(`Target element with ID ${targetId} not found for input ${inputElement.id}`);
        }
    };

    // Process inputs within a container
    const processInputs = (container) => {
        const inputs = container.querySelectorAll(settings.inputSelector);
        inputs.forEach(input => {
            // Initial toggle based on current state
            toggleTargetElement(input);

            // Remove existing listener to prevent duplicates
            input.removeEventListener(settings.eventType, toggleTargetElement);

            // Add new event listener
            input.addEventListener(settings.eventType, () => toggleTargetElement(input));
        });

        return inputs;
    };

    // Process all containers
    const containers = document.querySelectorAll(settings.containerSelector);
    if (!containers.length) {
        console.warn(`No containers found for selector: ${settings.containerSelector}`);
        return [];
    }

    const allInputs = [];
    containers.forEach(container => {
        allInputs.push(...processInputs(container));
    });

    // Optional: Observe DOM changes for dynamically added elements
    if (settings.observeMutations) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    containers.forEach(container => {
                        if (container.contains(mutation.target)) {
                            processInputs(container);
                        }
                    });
                }
            });
        });

        containers.forEach(container => {
            observer.observe(container, settings.mutationOptions);
        });

        // Cleanup observer on page unload
        window.addEventListener('unload', () => observer.disconnect());
    }

    return allInputs; // Return processed inputs for further use
}

function setupDynamicCheckboxAlert() {
    // List of target div classes
    const targetClasses = [
        '.table-manager',
        '.area-details',
        '.table-details',
        '.field-details',
        '.field-settings',
        '.field-settings-details'
    ];

    // Process each target div
    targetClasses.forEach((classSelector) => {
        const targetDiv = document.querySelector(classSelector);
        if (!targetDiv) {
            console.warn(`No div with class ${classSelector} found`);
            return;
        }

        // Function to setup click event on a checkbox
        const setupCheckbox = (checkbox) => {
            // Check if checkbox is associated with label "visible"
            const isVisibleCheckbox = isCheckboxLabeledVisible(checkbox);
            if (!isVisibleCheckbox) return;

            checkbox.addEventListener('click', () => {
                const listBoxContainer = targetDiv.querySelector('.list-box-container');
                if (listBoxContainer) {
                    listBoxContainer.style.display = checkbox.checked ? 'block' : 'none';
                } else {
                    console.warn(`No .list-box-container found in ${classSelector}`);
                }
            });
        };

        // Check if checkbox is associated with label "visible"
        const isCheckboxLabeledVisible = (checkbox) => {
            // Check if checkbox has an ID and a corresponding <label for="id">
            const id = checkbox.id;
            if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label && label.textContent.trim().toLowerCase().includes('visible')) {
                    return true;
                }
            }
            // Check parent or sibling <label> elements
            const parentLabel = checkbox.closest('label');
            if (parentLabel && parentLabel.textContent.trim().toLowerCase().includes('visible')) {
                return true;
            }
            return false;
        };

        // Process existing checkboxes
        const existingCheckboxes = targetDiv.querySelectorAll('input[type="checkbox"]');
        existingCheckboxes.forEach(setupCheckbox);

        // Set up MutationObserver for dynamically added checkboxes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if node is a checkbox or contains checkboxes
                            const checkboxes = node.matches('input[type="checkbox"]')
                                ? [node]
                                : node.querySelectorAll('input[type="checkbox"]');
                            checkboxes.forEach(setupCheckbox);
                        }
                    });
                }
            });
        });

        // Observe changes in target div (optimized to watch for elements)
        observer.observe(targetDiv, {
            childList: true,
            subtree: true
        });
    });
}

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', setupDynamicCheckboxAlert);

//div styling 



// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, initializing menu");
    loadMenu();
    //hideElementsOnLoad();

});