let cachedAss = null;

document.addEventListener("DOMContentLoaded", function () {
    loadAssInfo(1).then((data) => {
        cachedAss = data;
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
        tbody.innerHTML = '<tr><td colspan="3">No Associacoes found.</td></tr>';
        return;
    }
    accs.forEach((acc) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${acc[0]}</td>
        <td>${acc[1]}</td>
        <td>${acc[2]}</td>
        <td>${acc[3]}</td>
        <td>${acc[4]}</td>
        <td>${acc[5]}</td>
        <td>${acc[6]}</td>
        <td>
            <a href="#" class="edit-acc" data-id="${acc[0]}" title="Edit">
                <i class="fas fa-edit"></i>
            </a>
            <a href="#" class="delete-acc" data-id="${acc[0]}" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </a>
            <a href="/Ass/${acc[0]}" class="view-acc" data-id="${acc[0]}" title="View Info">
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

        const accId = e.target.closest(".edit-acc").getAttribute("data-id");
        openEditModal(accId);
    }

    if (e.target.closest(".view-acc")) {
        e.preventDefault();
        const accId = e.target.closest(".view-acc").getAttribute("data-id");
        window.location.href = `/Ass/${accId}`;
    }

    if (e.target.closest(".delete-acc")) {
        e.preventDefault();
        const accId = e.target
            .closest(".delete-acc")
            .getAttribute("data-id");
        if (confirm("Are you sure you want to delete this acc?")) {
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
                alert("Acc deleted successfully!");
                loadAssInfo(1);
            } else {
                console.error("Error deleting Acc:", data.message);
                alert("Error deleting Acc: " + data.message);
            }
        })
        .catch((error) => {
            console.error("Error deleting Acc:", error);
            alert("Error deleting Acc: " + error);
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

$("#openModalBtn").click(function () {
    loadUniversities("universityId").then(() => {
        $("#addAssModal").modal("show");
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


                const warning = document.createElement("div");
                warning.classList.add("alert", "alert-warning", "mt-2");
                warning.textContent = "⚠️ Todas as universidades já têm uma associação atribuída. Adicione uma nova universidade primeiro.";
                select.parentNode.insertBefore(warning, select.nextSibling);
                select.parentNode.removeChild(select);

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
function handleAddAssociation(event) {
    event.preventDefault(); // prevent the default form submission

    const assName = document.getElementById("assName").value.trim();
    const assSigla = document.getElementById("assSigla").value.trim();
    const universityAddres = document.getElementById("universityId").value;

    if (!assName || !assSigla || !universityAddres) {
        alert("Por favor, preencha todos os campos antes de adicionar uma associação.");
        return false;
    }

    const payload = new URLSearchParams({
        assName: assName,
        assSigla: assSigla,
        universityAddres: universityAddres
    });

    console.log("Processing add association request...");

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

// filter informaciotn


document.getElementById("filterForm").addEventListener("submit", function (event) {
    event.preventDefault();

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

    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== "") {
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


// edit model
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
                    noResults: function () {
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