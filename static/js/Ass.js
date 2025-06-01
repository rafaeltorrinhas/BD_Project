let cachedAss = null;

document.addEventListener("DOMContentLoaded", function () {
    loadAssInfo(1).then((data) => {
        cachedAss = data;
    });

    // Initialize Select2 for modalidade filter
    $('#filterModalidade').select2({
        placeholder: "Selecione uma ou mais modalidades",
        allowClear: true,
        width: '100%',
        language: {
            noResults: function() {
                return "Nenhuma modalidade encontrada";
            }
        }
    });

    // Fetch modalidades and populate the filter dropdown
    fetch('/api/modalidades')
        .then((response) => response.json())
        .then((data) => {
            const select = document.getElementById('filterModalidade');
            if (select && data.rows) {
                data.rows.forEach((mod) => {
                    const option = document.createElement('option');
                    option.value = mod[1]; // Use modalidade name for filtering
                    option.textContent = mod[1];
                    select.appendChild(option);
                });
                // Refresh Select2 to show the new options
                $('#filterModalidade').trigger('change');
            }
        });

    document.getElementById("searchInput").addEventListener("input", function () {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 2) {
            fetch(`/api/search_associacoes?search=${encodeURIComponent(searchTerm)}&page=1`)
                .then((response) => response.json())
                .then((data) => {
                    renderAssInfoTable(data.rows);
                    renderPagination(data.total_pages, data.current_page);
                })
                .catch((error) => console.error("Error fetching data:", error));
        } else {
            if (cachedAss) {
                renderAssInfoTable(cachedAss.rows);
                renderPagination(
                    cachedAss.total_pages,
                    cachedAss.current_page
                );
            } else {
                loadAssInfo(1).then((data) => {
                    cachedAss = data;
                });
            }
        }
    });
    document
        .getElementById("openModalBtn")
        .addEventListener("click", function () {
            $("#addAssModal").modal("show");
        });


})
function loadAssInfo(page) {
    return fetch(`/api/AssInfo?page=${page}`)
        .then((response) => response.json())
        .then((data) => {
            renderAssInfoTable(data.rows);
            renderPagination(data.total_pages, data.current_page);
            return data;
        })
        .catch((error) => console.error("Error fetching acc info:", error));
}


function renderAssInfoTable(accs) {
    const tbody = document.getElementById("accTableBody");

    tbody.innerHTML = "";
    if (accs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No Associations found.</td></tr>';
        return;
    }
    accs.forEach((acc) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${acc[0]}</td>
        <td>${acc[1]}</td>
        <td>${acc[2]}</td>
        <td>${acc[3] || ''}</td>
        <td>${acc[4] || 0}</td>
        <td>${acc[5] || 0}</td>
        <td>${acc[6] || 0}</td>
        <td>
            <a href="#" class="edit-acc" data-id="${acc[0]}" title="Edit">
                <i class="fas fa-edit"></i>
            </a>
            <a href="#" class="delete-acc" data-id="${acc[0]}" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </a>
            <a href="#" class="view-acc" data-id="${acc[0]}" title="View Info">
                <i class="fas fa-info-circle"></i>
            </a>
        </td>
    `;
        tbody.appendChild(row);
    });
}

document.addEventListener("click", function (e) {
    if (e.target.closest(".edit-acc")) {
        e.preventDefault();
        const assId = e.target.closest(".edit-acc").getAttribute("data-id");
        openEditModal(assId);
    }
    if (e.target.closest(".view-acc")) {
        e.preventDefault();
        const accId = e.target.closest(".view-acc").getAttribute("data-id");
        window.location.href = `/Ass/${accId}`;
    }

    if (e.target.closest(".delete-acc")) {
        e.preventDefault();
        const accId = e.target.closest(".delete-acc").getAttribute("data-id");
        if (confirm("Are you sure you want to delete this association?")) {
            deleteAcc(accId);
        }
    }
});

function deleteAcc(accId) {
    fetch(`/api/associacoes/${accId}`, {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                alert("Association deleted successfully!");
                loadAssInfo(1);
            } else {
                console.error("Error deleting association:", data.message);
                alert("Error deleting association: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error deleting association:", error);
            alert("Error deleting association: " + error);
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
            loadAssInfo(page);
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

function waitForSelectAndLoadUniversities(selectId, callback) {
    const interval = setInterval(() => {
        if (document.getElementById(selectId)) {
            clearInterval(interval);
            callback();
        }
    }, 50);
}

$("#openModalBtn").click(function () {
    $("#addAssModal").modal("show");
    $('#addAssModal').off('shown.bs.modal');
    $('#addAssModal').on('shown.bs.modal', function () {
        waitForSelectAndLoadUniversities("universityId", function() {
            loadUniversitiesNullAss("universityId");
        });
    });
});

function loadUniversities(selectElementId, selectedId = null, assId = 'NULL') {
    return fetch(`/api/universityAss/${assId}`)
        .then((response) => response.json())
        .then((data) => {
            const select = document.getElementById(selectElementId);
            if (!select) {
                console.error(`Select element with ID '${selectElementId}' not found!`);
                return;
            }
            if (!data.rows || data.rows.length === 0) {
                return;
            }
            select.innerHTML = "";
            console.log("Associations data:", data);
            data.rows.forEach((uni) => {
                const option = document.createElement("option");
                option.value = uni[0]; // University addrss
                option.textContent = uni[1]; //  University name
                if (selectedId && uni[0] === selectedId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        })
        .catch((error) => console.error("Error fetching associations:", error));
}

function loadUniversitiesNullAss(selectElementId) {
    return fetch('/api/uniNullAss')
        .then((response) => response.json())
        .then((data) => {
            console.log("Universities loaded:", data.rows); // Debug log
            const select = document.getElementById(selectElementId);
            if (!select) {
                console.error(`Select element with ID '${selectElementId}' not found!`);
                return;
            }
            if (!data.rows || data.rows.length === 0) {
                const warning = document.createElement("div");
                warning.className = "alert alert-warning";
                warning.textContent = "Não há universidades disponíveis";
                select.parentNode.insertBefore(warning, select.nextSibling);
                select.parentNode.removeChild(select);
                return;
            }
            select.innerHTML = "";
            data.rows.forEach((uni) => {
                const option = document.createElement("option");
                option.value = uni[0]; // University name
                option.textContent = uni[0]; // University name
                select.appendChild(option);
            });
            // Trigger change event to update Select2
            $(`#${selectElementId}`).trigger('change');
        })
        .catch((error) => console.error("Error fetching universities:", error));
}

function handleAddAssociation(event) {
    event.preventDefault(); // prevent the default form submission

    const assName = document.getElementById("assName").value.trim();
    const assSigla = document.getElementById("assSigla").value.trim();
    const selectedUniversities = $('#universityId').val() || [];

    // Debug logs
    console.log("Selected universities:", selectedUniversities);
    const payload = new URLSearchParams({
        assName: assName,
        assSigla: assSigla,
        universities: JSON.stringify(selectedUniversities)
    });
    console.log("Payload:", payload.toString());

    if (!assName || !assSigla || selectedUniversities.length === 0) {
        alert("Por favor, preencha todos os campos antes de adicionar uma associação.");
        return false;
    }

    fetch("/api/associacoes", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                $("#addAssModal").modal("hide");
                history.replaceState({}, document.title, window.location.pathname);
                loadAssInfo(1); // reload the association table (or whatever function you use)
            } else {
                console.error("Server error:", data.message);
            }
        })
        .catch((error) => console.error("Error adding association:", error));

    return false; // just in case it's called from inline onsubmit
}




document.getElementById("filterForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const activeFiltersContainer = document.getElementById("activeFilterTags");

    activeFiltersContainer.innerHTML = "";
    document.getElementById("activeFilters").style.display = "block";

    // Handle modalidades from Select2
    const selectedModalidades = $('#filterModalidade').val();
    if (selectedModalidades && selectedModalidades.length > 0) {
        selectedModalidades.forEach(modalidade => {
            const tag = document.createElement("div");
            tag.className = "filter-tag";
            tag.innerHTML = `
                <span>Modalidade: ${modalidade}</span>
                <button onclick="removeFilter('modalidade', '${modalidade}')" type="button">
                    <i class="fas fa-times"></i>
                </button>
            `;
            activeFiltersContainer.appendChild(tag);
        });
    }

    // Handle other filters
    for (let [key, value] of formData.entries()) {
        if (key !== 'modalidade' && value && value.trim() !== "") {
            const tag = document.createElement("div");
            tag.className = "filter-tag";

            let displayText = "";
            switch (key) {
                case "sort_by":
                    displayText = `Ordem: ${document.querySelector(
                        `#filterSortBy option[value=\"${value}\"]`
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

    const params = new URLSearchParams();
    
    // Add modalidades
    if (selectedModalidades && selectedModalidades.length > 0) {
        selectedModalidades.forEach(modalidade => {
            params.append('modalidade', modalidade);
        });
    }

    // Add other filters
    for (let [key, value] of formData.entries()) {
        if (key !== 'modalidade' && value && value.trim() !== "") {
            params.append(key, value);
        }
    }

    fetch(`/api/AssInfo?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
            renderAssInfoTable(data.rows);
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
    
    // Clear Select2
    $('#filterModalidade').val(null).trigger('change');

    // Hide active filters
    document.getElementById("activeFilters").style.display = "none";

    // Clear active filter tags
    document.getElementById("activeFilterTags").innerHTML = "";

    console.log("Filters cleared");
}

function removeFilter(key, value = null) {
    if (key === 'modalidade' && value) {
        const select = $('#filterModalidade');
        const values = select.val();
        const newValues = values.filter(v => v !== value);
        select.val(newValues).trigger('change');
    } else {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = "";
        }
    }
    document.getElementById("filterForm").dispatchEvent(new Event("submit"));
}

function openEditModal(id) {
    const ass = cachedAss.rows.find((a) => a[0] === parseInt(id));

    if (ass) {
        document.getElementById("editAssId").value = ass[0];
        document.getElementById("editAssName").value = ass[1];
        document.getElementById("editAssSigla").value = ass[2];

        // Initialize Select2 for universities if not already initialized
        if (!$('#editAssUniversity').hasClass("select2-hidden-accessible")) {
            $('#editAssUniversity').select2({
                placeholder: "Selecione uma ou mais universidades",
                allowClear: true,
                width: '100%',
                language: {
                    noResults: function() {
                        return "Nenhuma universidade encontrada";
                    }
                }
            });
        }

        // Load universities for the edit modal
        loadUniversities("editAssUniversity", null, id).then(() => {
            // First fetch all available modalidades
            return fetch('/api/modalidades');
        })
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('editAssModalidades');
            select.innerHTML = ''; // Clear existing options
            
            // Add all modalidades as options
            data.rows.forEach(mod => {
                const option = document.createElement('option');
                option.value = mod[1]; // Use modalidade name as value
                option.textContent = mod[1];
                select.appendChild(option);
            });

            // Then fetch and set the current association's modalidades
            return fetch(`/api/ass/${id}/modalidades`);
        })
        .then(response => response.json())
        .then(modalidadesData => {
            // Set the selected modalidades
            const selectedModalidades = modalidadesData.rows.map(row => row[1]);
            $('#editAssModalidades').val(selectedModalidades).trigger('change');
        })
        .catch(error => {
            console.error('Error loading modalidades:', error);
        });

        $("#editAssModal").modal("show");
    }
}

async function handleEditAssociation(event) {
    event.preventDefault();

    const id = document.getElementById("editAssId").value;
    const name = document.getElementById("editAssName").value;
    const sigla = document.getElementById("editAssSigla").value;
    const selectedUniversities = $('#editAssUniversity').val() || [];
    const selectedModalidades = $('#editAssModalidades').val() || [];

    try {
        // Update association details
        const formData = new FormData();
        formData.append('assName', name);
        formData.append('assSigla', sigla);
        formData.append('universities', JSON.stringify(selectedUniversities));

        const response = await fetch(`/api/associacoes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData)
        });

        if (!response.ok) {
            throw new Error("Failed to update association");
        }

        // Update modalidades
        const modalidadesResponse = await fetch(`/api/ass/${id}/modalidades`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                modalidades: selectedModalidades
            }),
        });

        if (!modalidadesResponse.ok) {
            const errorData = await modalidadesResponse.json();
            throw new Error(errorData.message || "Failed to update modalidades");
        }

        $("#editAssModal").modal("hide");
        
        // Reload the data to show updated modalidades
        const updatedData = await loadAssInfo(1);
        cachedAss = updatedData;
        renderAssInfoTable(updatedData.rows);
        renderPagination(updatedData.total_pages, updatedData.current_page);
    } catch (error) {
        console.error("Error updating association:", error);
        alert("Failed to update association: " + error.message);
    }
}
