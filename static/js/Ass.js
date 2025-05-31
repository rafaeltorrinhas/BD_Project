document.addEventListener("DOMContentLoaded", function () {
    loadAssInfo(1).then((data) => {
        cachedAss = data;
    });


})
function loadAssInfo(page) {
    return fetch(`/api/AssInfo?page=${page}`)
        .then((response) => response.json())
        .then((data) => {
            renderAssInfoTable(data.rows);
            renderPagination(data.total_pages, data.current_page);
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
            <a href="#" class="edit-athlete" data-id="${acc[0]}" title="Edit">
                <i class="fas fa-edit"></i>
            </a>
            <a href="#" class="delete-athlete" data-id="${acc[0]}" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </a>
            <a href="#" class="view-athlete" data-id="${acc[0]}" title="View Info">
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