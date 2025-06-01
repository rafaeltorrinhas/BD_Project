// Filtering logic for Universidades

document.getElementById("filterForm").addEventListener("submit", function (e) {
    e.preventDefault();

    // Build active filter tags
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
                case "nome":
                    displayText = `Nome: ${value}`;
                    break;
                case "sigla":
                    displayText = `Sigla: ${value}`;
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

    // Apply filters by querying the backend
    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
        if (value && value.trim() !== "") {
            params.append(key, value);
        }
    }
    fetch(`/api/universidades?${params.toString()}`)
        .then((response) => response.json())
        .then((data) => {
            renderUniversidadesTable(data.rows);
            // Optionally update pagination if you have it
        })
        .catch((error) => console.error("Error applying filters:", error));
});

function clearFilters() {
    document.getElementById("filterForm").reset();
    document.getElementById("activeFilters").style.display = "none";
    document.getElementById("activeFilterTags").innerHTML = "";
    // Optionally reload all data
    fetch(`/api/universidades`)
        .then((response) => response.json())
        .then((data) => {
            renderUniversidadesTable(data.rows);
        });
}

function removeFilter(filterType) {
    // Remove specific filter
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

function renderUniversidadesTable(rows) {
    const tbody = document.querySelector(".table tbody");
    tbody.innerHTML = "";
    rows.forEach((row) => {
        const tr = document.createElement("tr");
        for (let i = 0; i < row.length; i++) {
            const td = document.createElement("td");
            td.textContent = row[i];
            tr.appendChild(td);
        }
        // Add actions
        const actionsTd = document.createElement("td");
        actionsTd.innerHTML = `
            <a href="#" class="view-uni" data-id="${row[2]}" title="Ver Associação">
              <i class="fas fa-eye"></i>
            </a>
            <a href="#" class="delete-uni" data-id="${row[2]}" title="Apagar">
              <i class="fas fa-trash-alt"></i>
            </a>
        `;
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
    });
}

function toggleFilters() {
    const content = document.getElementById("filterContent");
    const toggle = document.getElementById("filterToggle");
    content.classList.toggle("active");
    toggle.classList.toggle("active");
}
