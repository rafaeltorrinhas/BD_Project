let allModalidades = [];
let selectedModalidadesMap = new Map();


document.getElementById("filterForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // 1️⃣ Build active filter tags
    const formData = new FormData(this);
    const activeFiltersContainer = document.getElementById("activeFilterTags");

    activeFiltersContainer.innerHTML = "";
    document.getElementById("activeFilters").style.display = "block";

    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== "") {
            const tag = document.createElement("div");
            tag.className = "filter-tag";

            let displayText = "";
            switch (key) {
                case "association":
                    displayText = `Associação: ${document.querySelector(
                        `#filterAssociation option[value="${value}"]`
                    ).textContent}`;
                    break;
                case "min_age":
                    displayText = `Idade Mín: ${value}`;
                    break;
                case "max_age":
                    displayText = `Idade Máx: ${value}`;
                    break;
                case "sort_by":
                    displayText = `Ordem: ${document.querySelector(
                        `#filterSortBy option[value="${value}"]`
                    ).textContent}`;
                    break;
                default:
                    displayText = `${key}: ${value}`;
            }

            tag.innerHTML = `
                <span>${displayText}</span>
                <button onclick="removeFilter('${key}')" type="button">
                    <i class="fas fa-times"></i>
                </button>
            `;
            activeFiltersContainer.appendChild(tag);
        }
    }

    console.log("Filters applied:", Object.fromEntries(formData));

    // 2️⃣ Apply filters by querying the backend
    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== "") {
            params.append(key, value);
        }
    }

    fetch(`/api/inscritos?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
            renderAthletesTable(data.rows);
            renderPagination(data.total_pages, data.current_page);
        })
        .catch((error) => console.error("Error applying filters:", error));
});

function toggleFilters() {
    const content = document.getElementById("filterContent");
    const toggle = document.getElementById("filterToggle");

    content.classList.toggle("active");
    toggle.classList.toggle("active");
}

function clearFilters() {
    // Clear all form inputs
    document.getElementById("filterForm").reset();

    // Hide active filters
    document.getElementById("activeFilters").style.display = "none";

    // Clear active filter tags
    document.getElementById("activeFilterTags").innerHTML = "";

    console.log("Filters cleared");
}

function removeFilter(filterType) {
    // Remove specific filter
    console.log("Removing filter:", filterType);

    // Find and remove the filter tag
    const filterTags = document.querySelectorAll(".filter-tag");
    filterTags.forEach((tag) => {
        if (tag.textContent.toLowerCase().includes(filterType)) {
            tag.remove();
        }
    });

    // Hide active filters section if no tags remain
    const remainingTags = document.querySelectorAll(".filter-tag");
    if (remainingTags.length === 0) {
        document.getElementById("activeFilters").style.display = "none";
    }
}


function navigateToPage(pageUrl) {
    if (pageUrl) {
        window.location.href = pageUrl;
    }
}

$("#openModalBtn").click(function () {
    loadAssociations("athleteAssId").then(() => {
        loadModalidades().then(() => {
            // Clear the form
            document.getElementById("athleteName").value = "";
            document.getElementById("athleteNumeroCC").value = "";
            document.getElementById("athleteDateBirth").value = "";
            document.getElementById("athleteEmail").value = "";
            document.getElementById("athletePhone").value = "";
            document.getElementById("athleteAssId").value = "";
            const select = document.getElementById("modalidadesSelect");
            if (select) {
                Array.from(select.options).forEach(option => option.selected = false);
            }
            $("#addInfoModal").modal("show");
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    loadAthletes(1).then((data) => {
        cachedAthletes = data;
    });
    loadAssociations();

    document.getElementById("searchInput").addEventListener("input", function () {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 2) {
            fetch(`/api/search_athletes?search=${encodeURIComponent(searchTerm)}&page=1`)
                .then((response) => response.json())
                .then((data) => {
                    renderAthletesTable(data.rows);
                    renderPagination(data.total_pages, data.current_page);
                })
                .catch((error) => console.error("Error fetching data:", error));
        } else {
            if (cachedAthletes) {
                renderAthletesTable(cachedAthletes.rows);
                renderPagination(
                    cachedAthletes.total_pages,
                    cachedAthletes.current_page
                );
            } else {
                loadAthletes(1).then((data) => {
                    cachedAthletes = data;
                });
            }
        }
    });

    document
        .getElementById("openModalBtn")
        .addEventListener("click", function () {
            $("#addInfoModal").modal("show");
        });
});
function handleAddAthlete(event) {
    event.preventDefault();
    
    const select = document.getElementById("modalidadesSelect");
    const selectedOptions = Array.from(select.selectedOptions);
    
    if (selectedOptions.length === 0) {
        alert("Please select at least one sports modalidade.");
        return false;
    }

    const payload = new URLSearchParams({
        athleteName: document.getElementById("athleteName").value,
        athleteNumeroCC: document.getElementById("athleteNumeroCC").value,
        athleteDateBirth: document.getElementById("athleteDateBirth").value,
        athleteEmail: document.getElementById("athleteEmail").value,
        athletePhone: document.getElementById("athletePhone").value,
        athleteAssId: document.getElementById("athleteAssId").value,
        modalidadesIds: selectedOptions.map(option => option.value).join(',')
    });

    console.log("Processing add athlete request...");
    console.log("Selected modalidades:", selectedOptions.map(option => option.textContent));

    fetch("/api/inscritos", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === "success") {
            $("#addInfoModal").modal("hide");
            // Clear the form
            document.getElementById("athleteName").value = "";
            document.getElementById("athleteNumeroCC").value = "";
            document.getElementById("athleteDateBirth").value = "";
            document.getElementById("athleteEmail").value = "";
            document.getElementById("athletePhone").value = "";
            document.getElementById("athleteAssId").value = "";
            Array.from(select.options).forEach(option => option.selected = false);
            
            history.replaceState({}, document.title, window.location.pathname);
            loadAthletes(1);
        } else {
            console.error("Server error:", data.message);
        }
    })
    .catch((error) => console.error("Error adding athlete:", error));

    return false;
}

function loadAthletes(page) {
    return fetch(`/api/inscritos?page=${page}`)
        .then((response) => response.json())
        .then((data) => {
            renderAthletesTable(data.rows);
            renderPagination(data.total_pages, data.current_page);
            return data;
        })
        .catch((error) => console.error("Error fetching athletes:", error));
}

function resetModalidadesForm() {
    selectedModalidadesMap.clear();
    updateSelectedModalidadesDisplay();
    updateHiddenInput();
    const searchInput = document.getElementById("searchModalidades");
    if (searchInput) {
        searchInput.value = "";
    }
    renderModalidadesCheckboxes(allModalidades);
}

function updateHiddenInput() {
    const hiddenInput = document.getElementById("selectedModalidadesIds");
    if (hiddenInput) {
        const selectedIds = Array.from(selectedModalidadesMap.keys());
        hiddenInput.value = selectedIds.join(',');
    }
}
function removeModalidade(id) {
    const checkbox = document.getElementById(`modalidade_${id}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    selectedModalidadesMap.delete(id);
    updateSelectedModalidadesDisplay();
    updateHiddenInput();
}
function updateSelectedModalidadesDisplay() {
    const container = document.getElementById("selectedModalidades");
    if (!container) return;

    if (selectedModalidadesMap.size === 0) {
        container.innerHTML = '<small class="text-muted">Selected modalidades will appear here</small>';
        return;
    }

    let tagsHTML = '';
    selectedModalidadesMap.forEach((name, id) => {
        tagsHTML += `
            <span class="modalidade-tag">
                ${name}
                <a href="#" class="remove-tag" onclick="removeModalidade(${id}); return false;">&times;</a>
            </span>
        `;
    });

    container.innerHTML = tagsHTML;
}
function toggleModalidade(id, name) {
    const checkbox = document.getElementById(`modalidade_${id}`);

    if (checkbox.checked) {
        selectedModalidadesMap.set(id, name);
    } else {
        selectedModalidadesMap.delete(id);
    }

    updateSelectedModalidadesDisplay();
    updateHiddenInput();
}
function renderModalidadesCheckboxes(modalidades) {
    const container = document.getElementById("modalidadesContainer");
    if (!container) return;

    container.innerHTML = "";

    modalidades.forEach(modalidade => {
        const [id, name] = modalidade;
        const checkboxDiv = document.createElement("div");
        checkboxDiv.className = "modalidade-checkbox";
        checkboxDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${id}" 
                       id="modalidade_${id}" onchange="toggleModalidade(${id}, '${name}')">
                <label class="form-check-label" for="modalidade_${id}">
                    ${name}
                </label>
            </div>
        `;
        container.appendChild(checkboxDiv);
    });
}

function initializeModalidadesSearch() {
    const searchInput = document.getElementById("searchModalidades");
    if (!searchInput) return;

    searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase().trim();

        if (searchTerm === "") {
            renderModalidadesCheckboxes(allModalidades);
        } else {
            const filteredModalidades = allModalidades.filter(modalidade =>
                modalidade[1].toLowerCase().includes(searchTerm)
            );
            renderModalidadesCheckboxes(filteredModalidades);
        }

        // Re-check previously selected modalidades
        selectedModalidadesMap.forEach((name, id) => {
            const checkbox = document.getElementById(`modalidade_${id}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    });
}

function renderAthletesTable(athletes) {
    const tbody = document.getElementById("athletesTableBody");

    tbody.innerHTML = "";
    if (athletes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No athletes found.</td></tr>';
        return;
    }

    athletes.forEach((athlete) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${athlete[0]}</td>
            <td>${athlete[1]}</td>
            <td>${athlete[2] || 'No modalidades'}</td>
            <td>
                <a href="#" class="edit-athlete" data-id="${athlete[0]}" title="Edit">
                    <i class="fas fa-edit"></i>
                </a>
                <a href="#" class="delete-athlete" data-id="${athlete[0]}" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </a>
                <a href="#" class="view-athlete" data-id="${athlete[0]}" title="View Info">
                    <i class="fas fa-info-circle"></i>
                </a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPagination(totalPages, currentPage) {
    const pagination = document.querySelector(".pagination");
    pagination.innerHTML = "";

    if (totalPages <= 1) return;

    const createPageItem = (
        label,
        page,
        isDisabled = false,
        isActive = false
    ) => {
        const li = document.createElement("li");
        li.classList.add("page-item");
        if (isDisabled) li.classList.add("disabled");
        if (isActive) li.classList.add("active");
        const a = document.createElement("a");
        a.classList.add("page-link");
        a.href = "#";
        a.textContent = label;
        a.addEventListener("click", function (e) {
            e.preventDefault();
            loadAthletes(page);
        });
        li.appendChild(a);
        return li;
    };

    if (currentPage > 1) {
        pagination.appendChild(createPageItem("<<", 1));
        pagination.appendChild(createPageItem("<", currentPage - 1));
    }

    for (let i = 1; i <= totalPages; i++) {
        pagination.appendChild(createPageItem(i, i, false, i === currentPage));
    }

    if (currentPage < totalPages) {
        pagination.appendChild(createPageItem(">", currentPage + 1));
        pagination.appendChild(createPageItem(">>", totalPages));
    }
}

function loadAssociations(selectElementId, selectedId = null) {
    return fetch("/api/associacoes")
        .then((response) => response.json())
        .then((data) => {
            const select = document.getElementById(selectElementId);
            if (!select) {
                console.error(`Select element with ID '${selectElementId}' not found!`);
                return;
            }

            select.innerHTML = "";

            data.rows.forEach((association) => {
                const option = document.createElement("option");
                option.value = association[0]; // association ID
                option.textContent = association[1]; // association name
                if (selectedId && association[0] === selectedId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        })
        .catch((error) => console.error("Error fetching associations:", error));
}



function loadModalidades() {
    return fetch("/api/modalidades")
        .then(response => response.json())
        .then(data => {
            allModalidades = data.rows || [];
            const select = document.getElementById("modalidadesSelect");
            if (select) {
                select.innerHTML = "";
                allModalidades.forEach(modalidade => {
                    const option = document.createElement("option");
                    option.value = modalidade[0]; // ID
                    option.textContent = modalidade[1]; // Name
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error("Error fetching modalidades:", error);
        });
}





document.addEventListener("click", function (e) {
    if (e.target.closest(".view-athlete")) {
        e.preventDefault();
        const athleteId = e.target.closest(".view-athlete").getAttribute("data-id");
        showAthleteDetails(athleteId);
    }

    if (e.target.closest(".edit-athlete")) {
        e.preventDefault();
        const athleteId = e.target.closest(".edit-athlete").getAttribute("data-id");
        openEditModal(athleteId);
    }

    if (e.target.closest(".delete-athlete")) {
        e.preventDefault();
        const athleteId = e.target
            .closest(".delete-athlete")
            .getAttribute("data-id");
        if (confirm("Are you sure you want to delete this athlete?")) {
            deleteAthlete(athleteId);
        }
    }
});

function deleteAthlete(athleteId) {
    fetch(`/api/inscritos/${athleteId}`, {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                alert("Athlete deleted successfully!");
                loadAthletes(1);
            } else {
                console.error("Error deleting athlete:", data.message);
                alert("Error deleting athlete: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error deleting athlete:", error);
            alert("Error deleting athlete: " + error);
        });
}

function openEditModal(athleteId) {
    fetch(`/api/athlete/${athleteId}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                const athlete = data.athlete;
                document.getElementById("editAthleteId").value = athlete.id;
                document.getElementById("editAthleteName").value = athlete.name;
                document.getElementById("editAthleteNumeroCC").value = athlete.numeroCC;
                document.getElementById("editAthleteDateBirth").value = athlete.dateBirth;
                document.getElementById("editAthleteEmail").value = athlete.email;
                document.getElementById("editAthletePhone").value = athlete.phone;

                // Store athlete's current modalidades for later use
                const athleteModalidades = athlete.modalidades || [];

                // First load associations and set the selected one
                loadAssociations("editAthleteAssId", athlete.associationId).then(() => {
                    // Add event listener for association change
                    const assSelect = document.getElementById("editAthleteAssId");
                    assSelect.addEventListener("change", function() {
                        loadModalidadesForAssociation(this.value, athleteModalidades);
                    });

                    // Initial load of modalidades
                    loadModalidadesForAssociation(athlete.associationId, athleteModalidades);
                });

                $("#editInfoModal").modal("show");
            } else {
                console.error("Athlete not found");
            }
        })
        .catch((error) => console.error("Error loading athlete:", error));
}

function loadModalidadesForAssociation(associationId, athleteModalidades) {
    // Get association's modalidades from FADU_ASSMODALIDADE
    fetch(`/api/ass/${associationId}/modalidades`)
        .then(response => response.json())
        .then(data => {
            const assModalidades = data.rows || [];
            const assModalidadesIds = new Set(assModalidades.map(m => m[0]));
            
            // Get all modalidades to show athlete's current ones
            return fetch("/api/modalidades")
                .then(response => response.json())
                .then(allData => {
                    const allModalidades = allData.rows || [];
                    const combinedModalidades = new Map();
                    
                    // Add all association modalidades
                    assModalidades.forEach(m => {
                        combinedModalidades.set(m[0], {
                            id: m[0],
                            name: m[1]
                        });
                    });
                    
                    // Add athlete's current modalidades that aren't in the association
                    if (athleteModalidades) {
                        athleteModalidades.forEach(m => {
                            if (!assModalidadesIds.has(m.id)) {
                                combinedModalidades.set(m.id, m);
                            }
                        });
                    }
                    
                    // Populate the select
                    const select = document.getElementById("editModalidadesSelect");
                    if (select) {
                        select.innerHTML = "";
                        combinedModalidades.forEach(modalidade => {
                            const option = document.createElement("option");
                            option.value = modalidade.id;
                            option.textContent = modalidade.name;
                            // Add a visual indicator for modalidades not in the current association
                            if (!assModalidadesIds.has(modalidade.id)) {
                                option.textContent += " (outra associação)";
                            }
                            select.appendChild(option);
                        });

                        // Select the athlete's current modalidades
                        if (athleteModalidades) {
                            athleteModalidades.forEach(modalidade => {
                                const option = select.querySelector(`option[value="${modalidade.id}"]`);
                                if (option) {
                                    option.selected = true;
                                }
                            });
                        }
                    }
                });
        })
        .catch(error => console.error("Error loading modalidades:", error));
}

function handleEditAthlete(event) {
    event.preventDefault();

    const athleteId = document.getElementById("editAthleteId").value;
    const payload = new URLSearchParams({
        athleteName: document.getElementById("editAthleteName").value,
        athleteNumeroCC: document.getElementById("editAthleteNumeroCC").value,
        athleteDateBirth: document.getElementById("editAthleteDateBirth").value,
        athleteEmail: document.getElementById("editAthleteEmail").value,
        athletePhone: document.getElementById("editAthletePhone").value,
        athleteAssId: document.getElementById("editAthleteAssId").value
    });

    // First update the athlete's basic info
    fetch(`/api/athlete/${athleteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === "success") {
            // Then update the modalidades
            const select = document.getElementById("editModalidadesSelect");
            const selectedOptions = Array.from(select.selectedOptions);
            const modalidadesPayload = {
                modalidades: selectedOptions.map(option => ({
                    id: parseInt(option.value),
                    name: option.textContent.replace(" (outra associação)", "")
                }))
            };
            
            return fetch(`/api/athlete/${athleteId}/modalidades`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(modalidadesPayload)
            });
        } else {
            throw new Error(data.message || "Error updating athlete");
        }
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === "success") {
            $("#editInfoModal").modal("hide");
            loadAthletes(1); // Refresh the table
        } else {
            throw new Error(data.message || "Error updating modalidades");
        }
    })
    .catch((error) => {
        console.error("Error updating athlete:", error);
        alert("Error updating athlete: " + error.message);
    });

    return false;
}

function showAthleteDetails(athleteId) {
    console.log("Fetching details for athlete ID:", athleteId);
    fetch(`/api/athlete/${athleteId}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                renderAthleteDetails(data.athlete);
                $("#athleteDetailsModal").modal("show");
            } else {
                console.error("Failed to fetch athlete details:", data.message);
            }
        })
        .catch((error) => console.error("Error fetching athlete details:", error));
}

function renderAthleteDetails(athlete) {
    const body = document.getElementById("athleteDetailsBody");
    body.innerHTML = `
        <dl class="row">
            <dt class="col-sm-4">Name:</dt><dd class="col-sm-8">${athlete.name}</dd>
            <dt class="col-sm-4">NumeroCC:</dt><dd class="col-sm-8">${athlete.numeroCC}</dd>
            <dt class="col-sm-4">Date of Birth:</dt><dd class="col-sm-8">${athlete.dateBirth}</dd>
            <dt class="col-sm-4">Email:</dt><dd class="col-sm-8">${athlete.email}</dd>
            <dt class="col-sm-4">Phone:</dt><dd class="col-sm-8">${athlete.phone}</dd>
            <dt class="col-sm-4">Association:</dt><dd class="col-sm-8">${athlete.associationName}</dd>
            <dt class="col-sm-4">Modalidades:</dt><dd class="col-sm-8">${athlete.modalidades ? athlete.modalidades.map(m => m.name).join(', ') : 'None'}</dd>
        </dl>
    `;
}
