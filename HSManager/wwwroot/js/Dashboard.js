const token = document.getElementById("token").value;
const userId = document.getElementById("userId").value;

console.log("Initializing - Token:", token);
console.log("Initializing - UserID:", userId);

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
    return await fetchWithAuth(url);
}

async function fetchTableManagerItem(itemType, itemId) {
    const url = `/api/tablemanager/item?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Fetching item - Type: ${itemType}, ID: ${itemId}`);
    return await fetchWithAuth(url);
}

async function setTableManagerItem(itemType, itemId, item) {
    const url = `/api/tablemanager/set?itemType=${itemType}&itemId=${itemId}`;
    console.log(`Setting item - Type: ${itemType}, ID: ${itemId}`);
    return await fetchWithAuth(url, 'POST', item);
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
            <li class="custom-list-item" data-id="${area.id}">${area.name}</li>
        `).join("");

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
    } catch (error) {
        console.error("Error in populateAreasList:", error);
        listBox.innerHTML = '<li class="custom-list-item error">Failed to load Areas</li>';
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
            <input type="text" value="${area.name}">
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
                    ${tables.map(table => `
                        <li class="custom-list-item" data-id="${table.id}">${table.name}</li>
                    `).join('')}
                </ul>
            </div>
            <h4>Area Icon</h4>
            <div class="icon-upload-container">
                ${area.icon && area.icon.base64 ? `<img src="${area.icon.base64}" alt="Area Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Area Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Area Properties</h4>
            <label><input type="checkbox" ${area.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${area.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachTableListListeners();

        const tableIconBar = divC.querySelector(".icon-bar");
        if (!tableIconBar) {
            console.error("Table icon bar not found");
            return;
        }
        console.log("Adding event listeners to table icon bar");
        tableIconBar.children[0].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Tables (up)");
            await sortItemsAlphabetically("Table", areaId);
        });
        tableIconBar.children[1].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Tables (down)");
            await sortItemsAlphabetically("Table", areaId);
        });
        tableIconBar.children[2].addEventListener("click", async () => {
            console.log("Add clicked for Tables");
            await addItem("Table", areaId);
        });
        tableIconBar.children[3].addEventListener("click", async () => {
            console.log("Delete clicked for Tables");
            await deleteItem("Table", areaId);
        });
    } catch (error) {
        console.error("Error in loadAreaDetails:", error);
        divC.innerHTML = '<h3>Failed to load Area details</h3>';
    }
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
                    ${fieldGroups.map(fg => `
                        <li class="custom-list-item" data-id="${fg.id}">${fg.name}</li>
                    `).join('')}
                </ul>
            </div>
            <h4>Table Icon</h4>
            <div class="icon-upload-container">
                ${table.icon && table.icon.base64 ? `<img src="${table.icon.base64}" alt="Table Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Table Properties</h4>
            <label><input type="checkbox" ${table.systemProperties?.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${table.systemProperties?.reserved ? 'checked' : ''}> Reserved</label>
            <h4>Table Features</h4>
            <label><input type="checkbox" ${table.systemProperties?.clearance ? 'checked' : ''} disabled> Clearance</label>
            <label><input type="checkbox" ${table.systemProperties?.timeline ? 'checked' : ''} disabled> Timeline</label>
            <label><input type="checkbox" ${table.systemProperties?.freezing ? 'checked' : ''} disabled> Freezing</label>
            <label><input type="checkbox" ${table.systemProperties?.versioning ? 'checked' : ''} disabled> Versioning</label>
        `;

        attachFieldGroupListListeners();

        const fieldGroupIconBar = divD.querySelector(".icon-bar");
        if (!fieldGroupIconBar) {
            console.error("Field Group icon bar not found");
            return;
        }
        console.log("Adding event listeners to field group icon bar");
        fieldGroupIconBar.children[0].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Field Groups (up)");
            await sortItemsAlphabetically("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[1].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Field Groups (down)");
            await sortItemsAlphabetically("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[2].addEventListener("click", async () => {
            console.log("Add clicked for Field Groups");
            await addItem("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[3].addEventListener("click", async () => {
            console.log("Delete clicked for Field Groups");
            await deleteItem("FieldGroup", tableId);
        });
    } catch (error) {
        console.error("Error in loadTableDetails:", error);
        divD.innerHTML = '<h3>Failed to load Table details</h3>';
    }
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
                    ${fields.map(field => `
                        <li class="custom-list-item" data-id="${field.id}">${field.name}</li>
                    `).join('')}
                </ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                ${fieldGroup.icon && fieldGroup.icon.base64 ? `<img src="${fieldGroup.icon.base64}" alt="Field Group Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Field Group Properties</h4>
            <label><input type="checkbox" ${fieldGroup.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${fieldGroup.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachFieldListListeners();

        const fieldIconBar = divE.querySelector(".icon-bar");
        if (!fieldIconBar) {
            console.error("Field icon bar not found");
            return;
        }
        console.log("Adding event listeners to field icon bar");
        fieldIconBar.children[0].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Fields (up)");
            await sortItemsAlphabetically("Field", fieldGroupId);
        });
        fieldIconBar.children[1].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Fields (down)");
            await sortItemsAlphabetically("Field", fieldGroupId);
        });
        fieldIconBar.children[2].addEventListener("click", async () => {
            console.log("Add clicked for Fields");
            await addItem("Field", fieldGroupId);
        });
        fieldIconBar.children[3].addEventListener("click", async () => {
            console.log("Delete clicked for Fields");
            await deleteItem("Field", fieldGroupId);
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
    } catch (error) {
        console.error("Error in loadFieldDetails:", error);
        divF.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field details</h3>';
        divG.innerHTML = '<h3 style="color: #ffffff;">Failed to load Field settings</h3>';
    }
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
                    ${fieldGroups.map(fg => `
                        <li class="custom-list-item" data-id="${fg.id}">${fg.name}</li>
                    `).join('')}
                </ul>
            </div>
            <h4>Table Icon</h4>
            <div class="icon-upload-container">
                ${table.icon && table.icon.base64 ? `<img src="${table.icon.base64}" alt="Table Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Table Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Table Properties</h4>
            <label><input type="checkbox" ${table.systemProperties?.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${table.systemProperties?.reserved ? 'checked' : ''}> Reserved</label>
            <h4>Table Features</h4>
            <label><input type="checkbox" ${table.systemProperties?.clearance ? 'checked' : ''} disabled> Clearance</label>
            <label><input type="checkbox" ${table.systemProperties?.timeline ? 'checked' : ''} disabled> Timeline</label>
            <label><input type="checkbox" ${table.systemProperties?.freezing ? 'checked' : ''} disabled> Freezing</label>
            <label><input type="checkbox" ${table.systemProperties?.versioning ? 'checked' : ''} disabled> Versioning</label>
        `;

        attachFieldGroupListListeners();

        const fieldGroupIconBar = divD.querySelector(".icon-bar");
        if (!fieldGroupIconBar) {
            console.error("Field Group icon bar not found");
            return;
        }
        console.log("Adding event listeners to field group icon bar");
        fieldGroupIconBar.children[0].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Field Groups (up)");
            await sortItemsAlphabetically("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[1].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Field Groups (down)");
            await sortItemsAlphabetically("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[2].addEventListener("click", async () => {
            console.log("Add clicked for Field Groups");
            await addItem("FieldGroup", tableId);
        });
        fieldGroupIconBar.children[3].addEventListener("click", async () => {
            console.log("Delete clicked for Field Groups");
            await deleteItem("FieldGroup", tableId);
        });
    } catch (error) {
        console.error("Error in loadTableDetails:", error);
        divD.innerHTML = '<h3>Failed to load Table details</h3>';
    }
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
                    ${fields.map(field => `
                        <li class="custom-list-item" data-id="${field.id}">${field.name}</li>
                    `).join('')}
                </ul>
            </div>
            <h4>Field Group Icon</h4>
            <div class="icon-upload-container">
                ${fieldGroup.icon && fieldGroup.icon.base64 ? `<img src="${fieldGroup.icon.base64}" alt="Field Group Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Group Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4.Field Group Properties</h4>
            <label><input type="checkbox" ${fieldGroup.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${fieldGroup.reserved ? 'checked' : ''}> Reserved</label>
        `;

        attachFieldListListeners();

        const fieldIconBar = divE.querySelector(".icon-bar");
        if (!fieldIconBar) {
            console.error("Field icon bar not found");
            return;
        }
        console.log("Adding event listeners to field icon bar");
        fieldIconBar.children[0].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Fields (up)");
            await sortItemsAlphabetically("Field", fieldGroupId);
        });
        fieldIconBar.children[1].addEventListener("click", async () => {
            console.log("Sort alphabetically clicked for Fields (down)");
            await sortItemsAlphabetically("Field", fieldGroupId);
        });
        fieldIconBar.children[2].addEventListener("click", async () => {
            console.log("Add clicked for Fields");
            await addItem("Field", fieldGroupId);
        });
        fieldIconBar.children[3].addEventListener("click", async () => {
            console.log("Delete clicked for Fields");
            await deleteItem("Field", fieldGroupId);
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
            <input type="text" value="${field.name || 'Unnamed'}" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Description</h4>
            <textarea style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 0; background-color: #ffffff; color: #000000; box-sizing: border-box; resize: vertical;">${field.description || ''}</textarea>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Status</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="visibleCheck" ${field.visible ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="visibleCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Visible</label>
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
                    <input type="checkbox" id="readOnlyCheck" ${field.properties?.readOnly ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="readOnlyCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Read only</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="reservedCheck" ${field.properties?.reserved ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="reservedCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Reserved</label>
                </div>
            </div>
            <h4 style="color: #ffffff; margin-bottom: 10px;">Field Features</h4>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="compulsoryCheck" ${field.features?.compulsory ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="compulsoryCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Compulsory</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="labelCheck" ${field.features?.label ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="labelCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Label</label>
                </div>
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                    <input type="checkbox" id="fullTextCheck" ${field.features?.fullTextIndexed ? 'checked' : ''} style="width: 16px; height: 16px; margin-right: 4px; margin-left: 0; accent-color: #ccc;">
                    <label for="fullTextCheck" style="color: #ffffff; font-size: 14px; margin: 0;">Full text indexed (if text)</label>
                </div>
            </div>
        `;

        // Debug: Log the rendered HTML to verify structure
        console.log("Rendered .field-settings HTML:", divF.innerHTML);

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

        // Debug: Log the rendered HTML for .field-settings-details
        console.log("Rendered .field-settings-details HTML:", divG.innerHTML);

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
        tables.forEach(table => {
            const tableId = table.dataset.id;
            deleteCascadingData("Table", tableId);
        });
        document.querySelector(".area-details").innerHTML = "";
    } else if (type === "Table") {
        const fieldGroups = document.querySelectorAll(`#fieldGroupList .custom-list-item`);
        fieldGroups.forEach(fg => {
            const fgId = fg.dataset.id;
            deleteCascadingData("FieldGroup", fgId);
        });
        document.querySelector(".table-details").innerHTML = "";
    } else if (type === "FieldGroup") {
        const fields = document.querySelectorAll(`#fieldList .custom-list-item`);
        fields.forEach(field => {
            const fieldId = field.dataset.id;
            deleteCascadingData("Field", fieldId);
        });
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
            console.log(`Area clicked: ${item.dataset.id}`);
            document.querySelectorAll("#areaList .custom-list-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const areaId = item.dataset.id;
            await loadAreaDetails(areaId);
        });
    });
}

function attachTableListListeners() {
    document.querySelectorAll("#tableList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            console.log(`Table clicked: ${item.dataset.id}`);
            document.querySelectorAll("#tableList .custom-list-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const tableId = item.dataset.id;
            await loadTableDetails(tableId);
        });
    });
}

function attachFieldGroupListListeners() {
    document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            console.log(`Field Group clicked: ${item.dataset.id}`);
            document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const fieldGroupId = item.dataset.id;
            await loadFieldGroupDetails(fieldGroupId);
        });
    });
}

function attachFieldListListeners() {
    document.querySelectorAll("#fieldList .custom-list-item").forEach(item => {
        item.addEventListener("click", async () => {
            console.log(`Field clicked: ${item.dataset.id}`);
            document.querySelectorAll("#fieldList .custom-list-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
            const fieldId = item.dataset.id;
            await loadFieldDetails(fieldId);
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
});