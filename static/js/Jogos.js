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

    // Sorting
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

    // Filtering
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
    // Hide filter section initially
    document.getElementById("filterContent").style.display = "none";



    // Filter input events
    document.getElementById("filterForm").addEventListener("change", applyFilters);
    document.getElementById("searchInput").addEventListener("input", applyFilters);

    // Focus on modalidade when modal opens
    const gameModal = document.getElementById("gameModal");
    if (gameModal) {
        gameModal.addEventListener("shown.bs.modal", () => {
            document.getElementById("modalidade").focus();
        });
    }
    loadGames()
});


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
// Needs to be fully changed to work just the structure
function addGame() {
    // Add your game submission logic here
    const form = document.getElementById('addGameForm');
    if (form.checkValidity()) {
        // Process form data
        console.log('Adding game...');
        // Close modal after successful submission
        const modal = bootstrap.Modal.getInstance(document.getElementById('gameModal'));
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

    columns.forEach(col => {
        const th = document.createElement("th");
        th.innerHTML = `<i class="fas fa-info-circle me-2"></i>${col}`;
        tableHeader.appendChild(th);
    });

    const actionsTh = document.createElement("th");
    actionsTh.innerHTML = '<i class="fas fa-cogs me-2"></i>Ações';
    tableHeader.appendChild(actionsTh);

    rows.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });

        // Add Actions cell
        const actionsTd = document.createElement("td");
        actionsTd.innerHTML = `
      <a href="#" class="view-game" data-id="${row[0]}" title="Ver Detalhes">
        <i class="fas fa-eye"></i>
      </a>
    `;
        tr.appendChild(actionsTd);

        tableBody.appendChild(tr);
    });
}