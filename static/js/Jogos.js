// View game redirect
document.addEventListener("click", function (e) {
    const viewGameLink = e.target.closest(".view-game");
    if (viewGameLink) {
        e.preventDefault();
        const gameId = viewGameLink.getAttribute("data-id");
        window.location.href = `/Jogos/${gameId}`;
    }
});

// Toggle filter section
function toggleFilters() {
    const filterContent = document.getElementById("filterContent");
    const filterToggle = document.getElementById("filterToggle");
    const isHidden = filterContent.style.display === "none" || !filterContent.style.display;

    filterContent.style.display = isHidden ? "block" : "none";
    filterToggle.innerHTML = isHidden
        ? '<i class="fas fa-chevron-up"></i>'
        : '<i class="fas fa-chevron-down"></i>';
}

// Clear filters
function clearFilters() {
    document.getElementById("filterForm").reset();
    document.getElementById("activeFilters").style.display = "none";
    document.getElementById("activeFilterTags").innerHTML = "";
    applyFilters();
}

// Filter label mapping
function getFilterLabel(key) {
    const labels = {
        game_date: "Data",
        sport: "Modalidade",
        phase: "Fase",
        sort_by: "Ordenação"
    };
    return labels[key] || key;
}

// Filter value mapping
function getFilterValue(key, value) {
    const valueLabels = {
        date_asc: "Data (Mais Antigo)",
        date_desc: "Data (Mais Recente)",
        sport_asc: "Modalidade (A-Z)",
        sport_desc: "Modalidade (Z-A)",
        phase_asc: "Fase (A-Z)",
        phase_desc: "Fase (Z-A)"
    };
    return valueLabels[value] || value;
}

// Remove a specific filter
function removeFilter(key) {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) {
        input.value = "";
        updateActiveFilters();
        applyFilters();
    }
}

// Apply all filters
function applyFilters() {
    const form = document.getElementById("filterForm");
    const formData = new FormData(form);
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const tbody = document.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const sortBy = formData.get("sort_by");
    if (sortBy) {
        rows.sort((a, b) => {
            let aValue = "", bValue = "";
            switch (sortBy) {
                case "date_asc":
                case "date_desc":
                    aValue = a.querySelector("td:nth-child(2)")?.textContent || "";
                    bValue = b.querySelector("td:nth-child(2)")?.textContent || "";
                    break;
                case "sport_asc":
                case "sport_desc":
                    aValue = a.querySelector("td:nth-child(3)")?.textContent || "";
                    bValue = b.querySelector("td:nth-child(3)")?.textContent || "";
                    break;
                case "phase_asc":
                case "phase_desc":
                    aValue = a.querySelector("td:nth-child(4)")?.textContent || "";
                    bValue = b.querySelector("td:nth-child(4)")?.textContent || "";
                    break;
            }
            return sortBy.endsWith("_desc")
                ? bValue.localeCompare(aValue)
                : aValue.localeCompare(bValue);
        });
        rows.forEach(row => tbody.appendChild(row));
    }

    rows.forEach(row => {
        const rowData = row.textContent.toLowerCase();
        let visible = true;

        if (searchTerm && !rowData.includes(searchTerm)) {
            visible = false;
        }

        const gameDate = formData.get("game_date");
        if (gameDate) {
            const rowDate = row.querySelector("td:nth-child(2)")?.textContent;
            if (rowDate !== gameDate) {
                visible = false;
            }
        }

        const sport = formData.get("sport");
        if (sport) {
            const rowSport = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase();
            if (!rowSport.includes(sport.toLowerCase())) {
                visible = false;
            }
        }

        const phase = formData.get("phase");
        if (phase) {
            const rowPhase = row.querySelector("td:nth-child(4)")?.textContent.toLowerCase();
            if (!rowPhase.includes(phase.toLowerCase())) {
                visible = false;
            }
        }

        row.style.display = visible ? "" : "none";
    });

    updateActiveFilters();
}

// Update active filter tags
function updateActiveFilters() {
    const activeFilters = document.getElementById("activeFilters");
    const activeFilterTags = document.getElementById("activeFilterTags");
    const form = document.getElementById("filterForm");
    const formData = new FormData(form);

    let hasActiveFilters = false;
    activeFilterTags.innerHTML = "";

    for (let [key, value] of formData.entries()) {
        if (value) {
            hasActiveFilters = true;
            const tag = document.createElement("span");
            tag.className = "filter-tag badge bg-secondary me-2 mb-2";
            const displayValue = key === "sort_by" ? getFilterValue(key, value) : value;
            tag.innerHTML = `
        ${getFilterLabel(key)}: ${displayValue}
        <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="removeFilter('${key}')"></i>
      `;
            activeFilterTags.appendChild(tag);
        }
    }

    activeFilters.style.display = hasActiveFilters ? "block" : "none";
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filterContent").style.display = "none";

    const selectElement = document.getElementById("modalidade");
    selectElement.addEventListener("change", function () {
        loadTeams().then((data) => {
            cachedTeamns = data;
        });;
    });

    const selectTeamHost = document.getElementById("teamHost");
    selectTeamHost.addEventListener("change", function () {
        if (cachedTeamns) {
            console.log(cachedTeamns)
            renderTeamOpo(cachedTeamns.columns, cachedTeamns.rows)
        }
    })
    const editTeamHostSelect = document.getElementById("editTeamHost");
    if (editTeamHostSelect) {
        editTeamHostSelect.addEventListener("change", function () {
            const selectedHostId = this.value;
            if (cachedEditTeams && selectedHostId) {
                renderEditTeamOpo(cachedEditTeams.columns, cachedEditTeams.rows, selectedHostId);
            } else {
                document.getElementById("editTeamOpo").innerHTML = '<option value="">Selecionar Team host primeiro</option>';
            }
        });
    }
    const editModalidadeSelect = document.getElementById("editModalidade");
    if (editModalidadeSelect) {
        editModalidadeSelect.addEventListener("change", function () {
            const selectedModalidade = this.value;
            if (selectedModalidade) {
                loadEditTeams(selectedModalidade);
            } else {
                document.getElementById("editTeamHost").innerHTML = '<option value="">Selecionar modalidade primeiro</option>';
                document.getElementById("editTeamOpo").innerHTML = '<option value="">Selecionar modalidade primeiro</option>';
            }
        });
    }

    const editGameModal = document.getElementById("editGameModal");
    if (editGameModal) {
        editGameModal.addEventListener("shown.bs.modal", () => {
            document.getElementById("editModalidade").focus();
        });

        editGameModal.addEventListener("hidden.bs.modal", () => {
            clearEditForm();
        });
    }

    document.addEventListener("click", function (e) {

        if (e.target.closest(".edit-game")) {
            e.preventDefault();
            const gameId = e.target.closest(".edit-game").getAttribute("data-id");
            openEditModal(gameId);
        }
        if (e.target.closest(".delete-game")) {
            e.preventDefault();
            const gameId = e.target.closest(".delete-game").getAttribute("data-id");
            deleteGame(gameId);
        }
    })


    // Filter input events
    document.getElementById("filterForm").addEventListener("change", applyFilters);
    document.getElementById("searchInput").addEventListener("input", applyFilters);

    // Focus on modalidade when modal opens
    const gameModal = document.getElementById("gameModal");
    if (gameModal) {
        gameModal.addEventListener("shown.bs.modal", () => {
            loadModalidades()
            loadFases()
            document.getElementById("modalidade").focus();
        });
    }
    loadGames()
});

function deleteGame(id) {
    if (confirm('Are you sure you want to delete this game?')) {
        fetch(`/api/jogo/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                alert('Game deleted successfully!');
                location.reload();

            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting game');
            });
    }
}

function loadTeams() {
    const selectElement = document.getElementById("modalidade");
    const selectedValue = selectElement.value;

    return fetch(`/api/teams/${selectedValue}`).then((response) => response.json()).then((data) => { renderTeamHost(data.columns, data.rows); return data })
}

function renderTeamOpo(coluns, rows) {
    const selectMods = document.querySelector("#teamOpo")
    selectMods.innerHTML = '<option value="">Selecionar team</option>';

    const selectTest = document.getElementById("teamHost");
    const selectedValue = selectTest.value;
    rows.forEach(row => {
        if (row[0] != selectedValue) {
            const option = document.createElement("option");
            option.value = row[0];
            option.textContent = row[4];
            selectMods.appendChild(option);
        }
    });

}


function loadFases() {
    return fetch('/api/fases').then((response) => response.json()).then((data) => { renderFases(data.columns, data.rows) })
}

function renderFases(coluns, rows) {
    const selectMods = document.querySelector("#fase")
    selectMods.innerHTML = '<option value="">Selecionar fase</option>';
    rows.forEach(row => {
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[1];
        selectMods.appendChild(option);
    });
}


function renderTeamHost(coluns, rows) {
    const selectMods = document.querySelector("#teamHost")
    selectMods.innerHTML = '<option value="">Selecionar Team</option>';

    const selectOpo = document.querySelector("#teamOpo")
    selectOpo.innerHTML = '<option value="">Selecionar Team host primeiro</option>';

    rows.forEach(row => {
        console.log(row)
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[4];
        selectMods.appendChild(option);
    });
}


function loadModalidades() {
    return fetch('/api/modalidades').then((response) => response.json()).then((data) => { renderMods(data.columns, data.rows) })

}

function renderMods(coluns, rows) {
    const selectMods = document.querySelector("#modalidade")
    selectMods.innerHTML = '<option value="">Selecionar Modalidade</option>';

    rows.forEach(row => {
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[1];
        selectMods.appendChild(option);
    });
}


function loadGames(page) {
    return fetch(`/api/jogos?page=${page}`)
        .then((response) => response.json())
        .then((data) => {
            renderGamesTable(data.columns, data.rows);
            renderPagination(data.total_pages, data.current_page);
            return data;
        })
        .catch((error) => console.error("Error fetching athletes:", error));
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



// Clear form inputs
function clearForm() {
    document.getElementById("addGameForm").reset();
}
function addGame() {
    const hostValue = document.getElementById('teamHost').value;
    const opoValue = document.getElementById('teamOpo').value;
    const modValue = document.getElementById('modalidade').value;
    const minutos = parseInt(document.getElementById('duration').value, 10);
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    const duracao = `${String(horas).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`;
    const fase = document.getElementById('fase').value;
    const local = document.getElementById('camp').value;
    const date = document.getElementById('extraData').value;

    const form = document.getElementById('addGameForm');
    if (form.checkValidity()) {
        const gameData = {
            hostTeam: hostValue,
            opponentTeam: opoValue,
            modality: modValue,
            duration: duracao,
            phase: fase,
            location: local,
            date: date
        };

        console.log('Game Data:', gameData);

        fetch('/api/jogos/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Response from server:', data);
            })
            .catch(error => {
                console.error('Error sending game data:', error);
            });

        const modal = bootstrap.Modal.getInstance(document.getElementById('gameModal'));
        loadGames()
        modal.hide();
    } else {
        form.reportValidity();
    }
}
function renderGamesTable(columns, rows) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    if (columns.length === 0 || rows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="' + (columns.length + 1) + '" class="text-center">No games found.</td></tr>';
        return;
    }

    // Render table headers
    columns.forEach(col => {
        const th = document.createElement("th");
        th.innerHTML = `<i class="fas fa-info-circle me-2"></i>${col}`;
        tableHeader.appendChild(th);
    });

    // Add actions column header
    const actionsTh = document.createElement("th");
    actionsTh.innerHTML = '<i class="fas fa-cogs me-2"></i>Ações';
    tableHeader.appendChild(actionsTh);

    // Render table rows
    rows.forEach(row => {
        const tr = document.createElement("tr");

        row.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });

        const actionsTd = document.createElement("td");
        actionsTd.innerHTML = `
            <a href="#" class="view-game" data-id="${row[0]}" title="Ver Detalhes">
                <i class="fas fa-eye"></i>
            </a>
            <a href="#" class="edit-game" data-id="${row[0]}" title="Editar">
                <i class="fas fa-edit"></i>
            </a>
            <a href="#" class="delete-game" data-id="${row[0]}" title="Deletar">
                <i class="fas fa-trash-alt"></i>
            </a>
        `;
        tr.appendChild(actionsTd);

        tableBody.appendChild(tr);
    });
}
function openEditModal(gameId) {
    fetch(`/api/jogo/${gameId}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data)

            const game = data.rows[0];
            console.log(game)
            document.getElementById("editGameId").textContent = game[0];
            document.getElementById("editModalidade").value = game[6];
            document.getElementById("editFase").value = game[5];
            document.getElementById("editTeamHost").value = game[7];
            document.getElementById("editTeamOpo").value = game[8];
            document.getElementById("editCamp").value = game[4];
            document.getElementById("editDuration").value = game[2];
            document.getElementById("editDate").value = game[1];
            document.getElementById("editRes").value = game[3];



            const modal = new bootstrap.Modal(document.getElementById("editGameModal"));
            modal.show();

        })
        .catch((error) => console.error("Error loading game:", error));
}
function clearEditForm() {
    document.getElementById("editGameForm").reset();

    document.getElementById("editTeamHost").innerHTML = '<option value="">Selecionar Team</option>';
    document.getElementById("editTeamOpo").innerHTML = '<option value="">Selecionar Team host primeiro</option>';
}
let cachedEditTeams = null;

function loadEditModalData() {
    return Promise.all([
        loadModalidadesForEdit(),
        loadFasesForEdit()
    ]);
}

// Load modalidades for edit modal
function loadModalidadesForEdit() {
    return fetch('/api/modalidades')
        .then((response) => response.json())
        .then((data) => {
            renderEditMods(data.columns, data.rows);
            return data;
        });
}

// Render modalidades in edit modal
function renderEditMods(columns, rows) {
    const selectMods = document.querySelector("#editModalidade");
    selectMods.innerHTML = '<option value="">Selecionar Modalidade</option>';

    rows.forEach(row => {
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[1];
        selectMods.appendChild(option);
    });
}

// Load fases for edit modal
function loadFasesForEdit() {
    return fetch('/api/fases')
        .then((response) => response.json())
        .then((data) => {
            renderEditFases(data.columns, data.rows);
            return data;
        });
}

// Render fases in edit modal
function renderEditFases(columns, rows) {
    const selectFases = document.querySelector("#editFase");
    selectFases.innerHTML = '<option value="">Selecionar fase</option>';

    rows.forEach(row => {
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[1];
        selectFases.appendChild(option);
    });
}

// Load teams for edit modal based on selected modalidade
function loadEditTeams(modalidadeId) {
    return fetch(`/api/teams/${modalidadeId}`)
        .then((response) => response.json())
        .then((data) => {
            cachedEditTeams = data;
            renderEditTeamHost(data.columns, data.rows);
            return data;
        });
}

// Render host team dropdown in edit modal
function renderEditTeamHost(columns, rows) {
    const selectHost = document.querySelector("#editTeamHost");
    const selectOpo = document.querySelector("#editTeamOpo");

    selectHost.innerHTML = '<option value="">Selecionar Team</option>';
    selectOpo.innerHTML = '<option value="">Selecionar Team host primeiro</option>';

    rows.forEach(row => {
        const option = document.createElement("option");
        option.value = row[0];
        option.textContent = row[4];
        selectHost.appendChild(option);
    });
}

// Render opponent team dropdown in edit modal (excluding selected host team)
function renderEditTeamOpo(columns, rows, selectedHostId) {
    const selectOpo = document.querySelector("#editTeamOpo");
    selectOpo.innerHTML = '<option value="">Selecionar team</option>';

    rows.forEach(row => {
        if (row[0] != selectedHostId) {
            const option = document.createElement("option");
            option.value = row[0];
            option.textContent = row[4];
            selectOpo.appendChild(option);
        }
    });
}

function editGame() {
    const gameId = document.getElementById('editGameId').textContent;
    const hostValue = document.getElementById('editTeamHost').value;
    const opoValue = document.getElementById('editTeamOpo').value;
    const modValue = document.getElementById('editModalidade').value;
    const durationValue = document.getElementById('editDuration').value;
    const fase = document.getElementById('editFase').value;
    const local = document.getElementById('editCamp').value;
    const date = document.getElementById('editDate').value;
    const result = document.getElementById('editRes').value;

    let duracao = durationValue;
    if (durationValue && !durationValue.includes(':')) {
        const minutos = parseInt(durationValue, 10);
        const horas = Math.floor(minutos / 60);
        const minutosRestantes = minutos % 60;
        duracao = `${String(horas).padStart(2, '0')}:${String(minutosRestantes).padStart(2, '0')}`;
    }

    const form = document.getElementById('editGameForm');
    if (form.checkValidity()) {
        const gameData = {
            hostTeam: hostValue,
            opponentTeam: opoValue,
            modality: modValue,
            duration: duracao,
            phase: fase,
            location: local,
            date: date,
            result: result
        };

        console.log('Edit Game Data:', gameData);

        fetch(`/api/jogo/${gameId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Response from server:', data);

                alert('Jogo atualizado com sucesso!');

                const modal = bootstrap.Modal.getInstance(document.getElementById('editGameModal'));
                modal.hide();

                loadGames();
            })
            .catch(error => {
                console.error('Error updating game:', error);
                alert('Erro ao atualizar o jogo. Tente novamente.');
            });
    } else {
        form.reportValidity();
    }
}

// Enhanced openEditModal function
function openEditModal(gameId) {
    loadEditModalData().then(() => {
        return fetch(`/api/jogo/${gameId}`);
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Game data:", data);

            const game = data.rows[0];

            document.getElementById("editGameId").textContent = game[0];
            document.getElementById("editDate").value = game[1];
            document.getElementById("editDuration").value = game[2];
            document.getElementById("editRes").value = game[3] || '';
            document.getElementById("editCamp").value = game[4] || '';

            document.getElementById("editFase").value = game[5];

            const modalidadeId = game[6];
            document.getElementById("editModalidade").value = modalidadeId;

            return loadEditTeams(modalidadeId).then(() => {
                const hostTeamId = game[7];
                const opoTeamId = game[8];

                document.getElementById("editTeamHost").value = hostTeamId;

                if (cachedEditTeams) {
                    renderEditTeamOpo(cachedEditTeams.columns, cachedEditTeams.rows, hostTeamId);
                    document.getElementById("editTeamOpo").value = opoTeamId;
                }

                const modal = new bootstrap.Modal(document.getElementById("editGameModal"));
                modal.show();
            });
        })
        .catch((error) => {
            console.error("Error loading game for edit:", error);
            alert("Erro ao carregar dados do jogo para edição.");
        });
}