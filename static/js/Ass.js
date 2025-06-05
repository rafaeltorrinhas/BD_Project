let cachedAss = null;

document.addEventListener("DOMContentLoaded", function () {
    loadAssInfo(1).then((data) => {
        cachedAss = data;
    });

    // Populate modalidades filter select
    fetch('/api/modalidades')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('filterModalidade');
            if (select) {
                select.innerHTML = '';
                data.rows.forEach(mod => {
                    const option = document.createElement('option');
                    option.value = mod[0]; // Use modalidade ID as value
                    option.textContent = mod[1];
                    select.appendChild(option);
                });
                // Initialize Select2
                if (!$(select).hasClass("select2-hidden-accessible")) {
                    $(select).select2({
                        placeholder: "Selecione modalidades",
                        allowClear: true,
                        width: '100%'
                    });
                }
            }
        });

    document.getElementById("searchInput").addEventListener("input", function () {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 2) {
            fetch(`/api/AssInfo?acc_name=${encodeURIComponent(searchTerm)}&page=1`)
                .then((response) => response.json())
                .then((data) => {
                    renderAssInfoTable(data.rows);
                    renderPagination(data.total_pages, data.current_page);
                })
                .catch((error) => console.error("Error fetching data:", error));
        } else {
            loadAssInfo(1);
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

$("#openModalBtn").off('click').on('click', function () {
    loadUniversities('#universityId').then(() => {
        // Initialize Select2 if not already initialized
        if (!$('#universityId').hasClass("select2-hidden-accessible")) {
            $('#universityId').select2({
                placeholder: "Selecione as universidades",
                allowClear: true,
                width: '100%'
            });
        }
        $("#addAssModal").modal("show");
    });
});

function loadUniversities(select, isEdit = false, assId = null) {
    // Use assId as a query parameter if provided
    const url = assId ? `/api/universidades/sem_associacao?assId=${assId}` : '/api/universidades/sem_associacao';
    
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Clear old options and alerts
            $(select).empty();
            $(select).next('.alert').remove();
            
            if (!data.rows || data.rows.length === 0) {
                $(select).after('<div class="alert alert-warning">Nenhuma universidade disponível</div>');
                return;
            }
            
            // Add new options
            data.rows.forEach(row => {
                const option = new Option(`${row[1]} (${row[0]})`, row[0]);
                $(select).append(option);
            });
            
            // Initialize Select2 if not already initialized
            if (!$(select).hasClass("select2-hidden-accessible")) {
                $(select).select2({
                    placeholder: "Selecione as universidades",
                    allowClear: true,
                    width: '100%'
                });
            }
        })
        .catch(error => {
            console.error('Error loading universities:', error);
            $(select).after('<div class="alert alert-danger">Erro ao carregar universidades</div>');
        });
}
function handleAddAssociation(event) {
    event.preventDefault();
    
    const assName = $('#assName').val();
    const assSigla = $('#assSigla').val();
    const universities = $('#universityId').val();
    const modalidades = $('#addAssModalidades').val();
    
    if (!assName || !assSigla || !universities || universities.length === 0) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    const formData = new FormData();
    formData.append('assName', assName);
    formData.append('assSigla', assSigla);
    formData.append('universities', JSON.stringify(universities));
    formData.append('modalidades', JSON.stringify(modalidades));
    
    fetch('/api/associacoes', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            $('#addAssModal').modal('hide');
            loadAssInfo(1);
        } else {
            alert(data.message || 'Erro ao adicionar associação');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao adicionar associação');
    });
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

    // --- FIX: handle multiple modalidades ---
    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
        if (key === 'modalidade') {
            formData.getAll('modalidade').forEach(val => {
                params.append('modalidade', val);
            });
        } else if (value && value.trim() !== "") {
            params.append(key, value);
        }
    }
    // --- END FIX ---

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

        // Load universities for the edit modal, passing the association id
        loadUniversities('#editAssUniversity', false, id).then(() => {
            // Pre-select current universities for this association
            fetch(`/api/associacoes/${id}/universities`)
                .then(response => response.json())
                .then(data => {
                    $('#editAssUniversity').val(data.addresses).trigger('change');
                });
            // First fetch all available modalidades
            return fetch('/api/modalidades');
        })
            .then(response => response.json())
            .then(data => {
                const select = document.getElementById('editAssModalidades');
                select.innerHTML = ''; // Clear existing options

                // Add all modalidades as options (use ID as value)
                data.rows.forEach(mod => {
                    const option = document.createElement('option');
                    option.value = mod[0]; // Use modalidade ID as value
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
function handleEditAssociation(event) {
    event.preventDefault();
    
    const assId = $('#editAssId').val();
    const assName = $('#editAssName').val();
    const assSigla = $('#editAssSigla').val();
    const universities = $('#editAssUniversity').val();
    const modalidades = $('#editAssModalidades').val();
    
    if (!assName || !assSigla || !universities || universities.length === 0) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    const formData = new FormData();
    formData.append('assName', assName);
    formData.append('assSigla', assSigla);
    formData.append('universities', JSON.stringify(universities));
    formData.append('modalidades', JSON.stringify(modalidades));
    
    fetch(`/api/associacoes/${assId}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            $('#editAssModal').modal('hide');
            loadAssInfo(1);
        } else {
            alert(data.message || 'Erro ao atualizar associação');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Erro ao atualizar associação');
    });
}