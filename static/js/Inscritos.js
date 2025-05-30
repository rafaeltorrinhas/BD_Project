$("#openModalBtn").click(function () {
  $("#addInfoModal").modal("show");
});

document.addEventListener("DOMContentLoaded", function () {
  loadAthletes(1).then((data) => {
    cachedAthletes = data;
  });
  loadAssociations();

  document.getElementById("searchInput").addEventListener("input", function () {
    const searchTerm = this.value.trim();
    if (searchTerm.length > 2) {
      fetch(`/api/search_athletes?search=${encodeURIComponent(searchTerm)}`)
        .then((response) => response.json())
        .then((data) => renderAthletesTable(data[0].rows))
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
  event.preventDefault(); // prevent the default form submission

  const payload = new URLSearchParams({
    athleteName: document.getElementById("athleteName").value,
    athleteNumeroCC: document.getElementById("athleteNumeroCC").value,
    athleteDateBirth: document.getElementById("athleteDateBirth").value,
    athleteEmail: document.getElementById("athleteEmail").value,
    athletePhone: document.getElementById("athletePhone").value,
    athleteAssId: document.getElementById("athleteAssId").value,
  });

  console.log("Processing add athlete request...");

  fetch("/api/inscritos", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        $("#addInfoModal").modal("hide");
        history.replaceState({}, document.title, window.location.pathname);
        loadAthletes(1);
      } else {
        console.error("Server error:", data.message);
      }
    })
    .catch((error) => console.error("Error adding athlete:", error));

  return false; // just in case it's called from inline onsubmit
}

function loadAthletes(page) {
  return fetch(`/api/inscritos?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      renderAthletesTable(data.rows);
      renderPagination(data.total_pages, data.current_page);
    })
    .catch((error) => console.error("Error fetching athletes:", error));
}

function renderAthletesTable(athletes) {
  const tbody = document.getElementById("athletesTableBody");

  tbody.innerHTML = "";
  if (athletes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No athletes found.</td></tr>';
    return;
  }

  athletes.forEach((athlete) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${athlete[0]}</td>
        <td>${athlete[1]}</td>
        <td>
            <a href="#" class="edit-athlete" data-id="${athlete[0]}" title="Edit">
                <i class="fas fa-edit"></i>
            </a>
            <a href="#" id="delete-athlete" data-id="${athlete[0]}" title="Delete">
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
});

function openEditModal(athleteId) {
  fetch(`/api/athlete/${athleteId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        const athlete = data.athlete;
        document.getElementById("editAthleteId").value = athlete.id;
        document.getElementById("editAthleteName").value = athlete.name;
        document.getElementById("editAthleteNumeroCC").value = athlete.numeroCC;
        document.getElementById("editAthleteDateBirth").value =
          athlete.dateBirth;
        document.getElementById("editAthleteEmail").value = athlete.email;
        document.getElementById("editAthletePhone").value = athlete.phone;

        loadAssociations("editAthleteAssId", athlete.associationId);

        $("#editInfoModal").modal("show");
      } else {
        console.error("Athlete not found");
      }
    })
    .catch((error) => console.error("Error loading athlete:", error));
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
    athleteAssId: document.getElementById("editAthleteAssId").value,
  });

  fetch(`/api/athlete/${athleteId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        $("#editInfoModal").modal("hide");
        loadAthletes(1); // Refresh the table
      } else {
        console.error("Error updating athlete:", data.message);
      }
    })
    .catch((error) => console.error("Error updating athlete:", error));

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
        </dl>
    `;
}
