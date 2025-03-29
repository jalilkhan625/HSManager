const token = document.getElementById("token").value;
const userId = document.getElementById("userId").value;

console.log("Token from claims:", token);
console.log("UserID from claims:", userId);

async function fetchWithAuth(url, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return response.json();
}

async function fetchTableManagerListItems(itemType, itemId) {
    const url = `/api/tablemanager/list?itemType=${itemType}${itemId !== null ? `&itemId=${itemId}` : ''}`;
    return await fetchWithAuth(url);
}

async function fetchTableManagerItem(itemType, itemId) {
    const url = `/api/tablemanager/item?itemType=${itemType}&itemId=${itemId}`;
    return await fetchWithAuth(url);
}

async function setTableManagerItem(itemType, itemId, item) {
    const url = `/api/tablemanager/set?itemType=${itemType}&itemId=${itemId}`;
    return await fetchWithAuth(url, 'POST', item);
}

async function populateAreasList() {
    const listBox = document.querySelector("#areaList");
    listBox.innerHTML = '<li class="custom-list-item">Loading...</li>';

    try {
        const areas = await fetchTableManagerListItems("Area", null);
        listBox.innerHTML = areas.map(area => `
            <li class="custom-list-item" data-id="${area.id}">${area.name}</li>
        `).join("");

        document.querySelectorAll("#areaList .custom-list-item").forEach(item => {
            item.addEventListener("click", async () => {
                document.querySelectorAll("#areaList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const areaId = item.dataset.id;
                await loadAreaDetails(areaId);
            });
        });

        // Add event listeners for icon bar actions (Areas)
        const areaIconBar = document.querySelector(".table-manager .icon-bar");
        areaIconBar.children[0].addEventListener("click", async () => moveItem("Area", -1)); // Move Up
        areaIconBar.children[1].addEventListener("click", async () => moveItem("Area", 1));  // Move Down
        areaIconBar.children[2].addEventListener("click", async () => addItem("Area"));      // Add
        areaIconBar.children[3].addEventListener("click", async () => deleteItem("Area"));   // Delete
    } catch (error) {
        console.error("Error loading areas:", error);
        listBox.innerHTML = '<li class="custom-list-item error">Failed to load Areas</li>';
    }
}

async function loadAreaDetails(areaId) {
    const divC = document.querySelector(".area-details");
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");
    divC.style.display = "block"; // Show the area-details div
    divD.style.display = "none"; // Hide the table-details div
    divE.style.display = "none"; // Hide the field-details div
    divF.style.display = "none"; // Hide the field-settings div
    divG.style.display = "none"; // Hide the field-settings-details div

    try {
        const area = await fetchTableManagerItem("Area", areaId);
        const tables = await fetchTableManagerListItems("Table", areaId);

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
                    <img src="/assets/main-icons/move-up.png" alt="Move Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Move Down" />
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

        document.querySelectorAll("#tableList .custom-list-item").forEach(item => {
            item.addEventListener("click", async () => {
                document.querySelectorAll("#tableList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const tableId = item.dataset.id;
                await loadTableDetails(tableId);
            });
        });

        // Add event listeners for icon bar actions (Tables)
        const tableIconBar = divC.querySelector(".icon-bar");
        tableIconBar.children[0].addEventListener("click", async () => moveItem("Table", -1, areaId));
        tableIconBar.children[1].addEventListener("click", async () => moveItem("Table", 1, areaId));
        tableIconBar.children[2].addEventListener("click", async () => addItem("Table", areaId));
        tableIconBar.children[3].addEventListener("click", async () => deleteItem("Table", areaId));
    } catch (error) {
        console.error("Error loading area details:", error);
        divC.innerHTML = '<h3>Failed to load Area details</h3>';
    }
}

async function loadTableDetails(tableId) {
    const divD = document.querySelector(".table-details");
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");
    divD.style.display = "block"; // Show the table-details div
    divE.style.display = "none"; // Hide the field-details div
    divF.style.display = "none"; // Hide the field-settings div
    divG.style.display = "none"; // Hide the field-settings-details div

    try {
        const table = await fetchTableManagerItem("Table", tableId);
        const fieldGroups = await fetchTableManagerListItems("FieldGroup", tableId);

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
                    <img src="/assets/main-icons/move-up.png" alt="Move Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Move Down" />
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

        document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(item => {
            item.addEventListener("click", async () => {
                document.querySelectorAll("#fieldGroupList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const fieldGroupId = item.dataset.id;
                await loadFieldGroupDetails(fieldGroupId);
            });
        });

        // Add event listeners for icon bar actions (Field Groups)
        const fieldGroupIconBar = divD.querySelector(".icon-bar");
        fieldGroupIconBar.children[0].addEventListener("click", async () => moveItem("FieldGroup", -1, tableId));
        fieldGroupIconBar.children[1].addEventListener("click", async () => moveItem("FieldGroup", 1, tableId));
        fieldGroupIconBar.children[2].addEventListener("click", async () => addItem("FieldGroup", tableId));
        fieldGroupIconBar.children[3].addEventListener("click", async () => deleteItem("FieldGroup", tableId));
    } catch (error) {
        console.error("Error loading table details:", error);
        divD.innerHTML = '<h3>Failed to load Table details</h3>';
    }
}

async function loadFieldGroupDetails(fieldGroupId) {
    const divE = document.querySelector(".field-details");
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");
    divE.style.display = "block"; // Show the field-details div for Field Group details
    divF.style.display = "none"; // Hide the field-settings div
    divG.style.display = "none"; // Hide the field-settings-details div

    try {
        const fieldGroup = await fetchTableManagerItem("FieldGroup", fieldGroupId);
        const fields = await fetchTableManagerListItems("Field", fieldGroupId);

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
                    <img src="/assets/main-icons/move-up.png" alt="Move Up" />
                    <img src="/assets/main-icons/move-down.png" alt="Move Down" />
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

        document.querySelectorAll("#fieldList .custom-list-item").forEach(item => {
            item.addEventListener("click", async () => {
                document.querySelectorAll("#fieldList .custom-list-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
                const fieldId = item.dataset.id;
                await loadFieldDetails(fieldId);
            });
        });

        // Add event listeners for icon bar actions (Fields)
        const fieldIconBar = divE.querySelector(".icon-bar");
        fieldIconBar.children[0].addEventListener("click", async () => moveItem("Field", -1, fieldGroupId));
        fieldIconBar.children[1].addEventListener("click", async () => moveItem("Field", 1, fieldGroupId));
        fieldIconBar.children[2].addEventListener("click", async () => addItem("Field", fieldGroupId));
        fieldIconBar.children[3].addEventListener("click", async () => deleteItem("Field", fieldGroupId));
    } catch (error) {
        console.error("Error loading field group details:", error);
        divE.innerHTML = '<h3>Failed to load Field Group details</h3>';
    }
}

async function loadFieldDetails(fieldId) {
    const divF = document.querySelector(".field-settings");
    const divG = document.querySelector(".field-settings-details");
    divF.style.display = "block"; // Show the field-settings div for Field details
    divG.style.display = "block"; // Show the field-settings-details div for Field Settings

    try {
        const field = await fetchTableManagerItem("Field", fieldId);

        // DIV F: Field Name and related details
        divF.innerHTML = `
            <h3>Field Name</h3>
            <input type="text" value="${field.name}">
            <h4>Field Description</h4>
            <textarea>${field.description || ''}</textarea>
            <h4>Status</h4>
            <label><input type="checkbox" ${field.visible ? 'checked' : ''}> Visible</label>
            <h4>Field Data Type</h4>
            <input type="text" value="${field.dataType}" readonly>
            <h4>Field Data SubType</h4>
            <input type="text" value="${field.dataSubType}" readonly>
            <h4>Field Icon</h4>
            <div class="icon-upload-container">
                ${field.icon && field.icon.base64 ? `<img src="${field.icon.base64}" alt="Field Icon" class="icon-preview">` : '<img src="/assets/main-icons/home.png" alt="Field Icon" class="icon-preview">'}
                <button>Upload Icon</button>
            </div>
            <h4>Field Properties</h4>
            <label><input type="checkbox" ${field.properties?.readOnly ? 'checked' : ''}> Read only</label>
            <label><input type="checkbox" ${field.properties?.reserved ? 'checked' : ''}> Reserved</label>
            <h4>Field Features</h4>
            <label><input type="checkbox" ${field.features?.compulsory ? 'checked' : ''}> Compulsory</label>
            <label><input type="checkbox" ${field.features?.label ? 'checked' : ''}> Label</label>
            <label><input type="checkbox" ${field.features?.fullTextIndexed ? 'checked' : ''}> Full text indexed (if text)</label>
        `;

        // DIV G: Field Settings
        divG.innerHTML = `
            <h3>Field Settings</h3>
            <label>
                <span>Default Value</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="None" readonly>
            <label>
                <span>Validation Rules</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="None" readonly>
            <label>
                <span>Style</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="Default" readonly>
            <label>
                <span>Data Snip</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="None" readonly>
            <label>
                <span>Function</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="None" readonly>
            <label>
                <span>Client Help</span>
                <img src="/assets/main-icons/settings.png" alt="Settings" class="settings-icon">
            </label>
            <input type="text" value="None" readonly>
        `;

        divG.querySelectorAll(".settings-icon").forEach(icon => {
            icon.addEventListener("click", () => {
                const settingType = icon.parentElement.querySelector("span").textContent;
                openSettings(settingType);
            });
        });
    } catch (error) {
        console.error("Error loading field details:", error);
        divF.innerHTML = '<h3>Failed to load Field details</h3>';
        divG.innerHTML = '<h3>Failed to load Field settings</h3>';
    }
}

async function moveItem(type, direction, parentId = null) {
    const listId = type === "Area" ? "areaList" : type === "Table" ? "tableList" : type === "FieldGroup" ? "fieldGroupList" : "fieldList";
    const list = document.getElementById(listId);
    const selected = list.querySelector(".custom-list-item.selected");
    if (!selected) return;

    const items = await fetchTableManagerListItems(type, parentId);
    const itemId = parseInt(selected.dataset.id);
    const item = items.find(i => i.id === itemId);
    const index = items.findIndex(i => i.id === itemId);

    if (direction === -1 && index > 0) {
        const prevItem = items[index - 1];
        const tempSortIndex = item.sortIndex;
        item.sortIndex = prevItem.sortIndex;
        prevItem.sortIndex = tempSortIndex;
        await setTableManagerItem(type, item.id, item);
        await setTableManagerItem(type, prevItem.id, prevItem);
    } else if (direction === 1 && index < items.length - 1) {
        const nextItem = items[index + 1];
        const tempSortIndex = item.sortIndex;
        item.sortIndex = nextItem.sortIndex;
        nextItem.sortIndex = tempSortIndex;
        await setTableManagerItem(type, item.id, item);
        await setTableManagerItem(type, nextItem.id, nextItem);
    }

    if (type === "Area") await populateAreasList();
    else if (type === "Table") await loadAreaDetails(parentId);
    else if (type === "FieldGroup") await loadTableDetails(parentId);
    else if (type === "Field") await loadFieldGroupDetails(parentId);
}

async function deleteItem(type, parentId = null) {
    const listId = type === "Area" ? "areaList" : type === "Table" ? "tableList" : type === "FieldGroup" ? "fieldGroupList" : "fieldList";
    const list = document.getElementById(listId);
    const selected = list.querySelector(".custom-list-item.selected");
    if (!selected) return;

    // Note: The API doesn't support deletion, so we'll just refresh the list for now
    if (type === "Area") await populateAreasList();
    else if (type === "Table") await loadAreaDetails(parentId);
    else if (type === "FieldGroup") await loadTableDetails(parentId);
    else if (type === "Field") await loadFieldGroupDetails(parentId);
}

async function addItem(type, parentId = null) {
    const listId = type === "Area" ? "areaList" : type === "Table" ? "tableList" : type === "FieldGroup" ? "fieldGroupList" : "fieldList";
    const list = document.getElementById(listId);
    const items = await fetchTableManagerListItems(type, parentId);
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    const newItem = {
        id: newId,
        parentId: parentId || 0,
        name: `${type} ${items.length + 1}`,
        description: "",
        visible: true,
        sortIndex: items.length,
        icon: null,
        readOnly: false,
        reserved: false,
        systemProperties: type === "Table" ? { clearance: false, timeline: false, freezing: false, versioning: false, staticData: false, virtualData: false } : null,
        properties: type === "Field" ? { readOnly: false, reserved: false } : null,
        features: type === "Field" ? { compulsory: false, label: false, fullTextIndexed: false } : null,
        dataType: type === "Field" ? "Text" : null,
        dataSubType: type === "Field" ? "String" : null
    };

    await setTableManagerItem(type, newId, newItem);

    if (type === "Area") await populateAreasList();
    else if (type === "Table") await loadAreaDetails(parentId);
    else if (type === "FieldGroup") await loadTableDetails(parentId);
    else if (type === "Field") await loadFieldGroupDetails(parentId);
}

function openSettings(settingType) {
    console.log(`Opening settings for: ${settingType}`);
    // Add logic here to open a modal or dialog for the specific setting
}

async function loadMenu() {
    if (!token || !userId) {
        console.error("Token or UserId missing");
        return;
    }

    try {
        const response = await fetch(`/api/menu?token=${token}&userId=${userId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to load menu: ${response.statusText}`);

        const menuItems = await response.json();
        console.log("Menu Items:", menuItems);

        const menuList = document.getElementById("menuList");
        menuList.innerHTML = menuItems.map(item => `
            <li class="nav-item mb-3">
                <a class="nav-link text-white" href="#" data-id="${item.id}" title="${item.description}">
                    <img src="${item.icon?.base64 || `/assets/main-icons/default-icon-${item.id}.png`}" alt="${item.icon?.alternativeText || item.description}" width="24" height="24">
                </a>
            </li>
        `).join("");

        const sidebar = document.querySelector(".sidebar");
        const floatingLabel = document.getElementById("floatingLabel");
        sidebar.appendChild(floatingLabel);

        let activeId = null;
        let hideTooltipTimeout;

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("mouseenter", (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                activeId = id;

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
                hideTooltipTimeout = setTimeout(() => {
                    floatingLabel.style.display = "none";
                    activeId = null;
                }, 200);
            });
        });

        floatingLabel.addEventListener("mouseenter", () => {
            clearTimeout(hideTooltipTimeout);
        });

        floatingLabel.addEventListener("mouseleave", () => {
            hideTooltipTimeout = setTimeout(() => {
                floatingLabel.style.display = "none";
                activeId = null;
            }, 200);
        });

        floatingLabel.addEventListener("click", async () => {
            if (activeId === null) return;

            const contentArea = document.getElementById("dashboardContent");
            const tableManagerContainer = document.getElementById("tableManagerContainer");

            if (activeId === 1) {
                contentArea.querySelector("h1").style.display = "none";
                contentArea.querySelector("p").style.display = "none";
                tableManagerContainer.style.display = "flex";
                await populateAreasList();
            }
        });
    } catch (error) {
        console.error("Error loading menu:", error);
        // Fallback to placeholder icons already in the HTML
    }
}

const logoutToggle = document.getElementById("logoutToggle");
const logoutPopup = document.getElementById("logoutPopup");
const cancelBtn = document.getElementById("cancelLogout");

logoutToggle.addEventListener("click", (e) => {
    e.preventDefault();
    logoutPopup.style.display = logoutPopup.style.display === "block" ? "none" : "block";
});

cancelBtn.addEventListener("click", () => {
    logoutPopup.style.display = "none";
});

document.addEventListener("click", (e) => {
    if (!logoutPopup.contains(e.target) && !logoutToggle.contains(e.target)) {
        logoutPopup.style.display = "none";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadMenu();
});