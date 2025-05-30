

$('#openModalBtn').click(function () {
    $('#addInfoModal').modal('show');
});


document.addEventListener('DOMContentLoaded', function () {
    loadAthletes(1).then(data => {
        cachedAthletes = data;
    });
    loadAssociations();

    document.getElementById('searchInput').addEventListener('input', function () {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 2) {
            fetch(`/api/search_athletes?search=${encodeURIComponent(searchTerm)}`)
                .then(response => response.json())
                .then(data => renderAthletesTable((data[0].rows)))
                .catch(error => console.error('Error fetching data:', error));
        }
        else {
            if (cachedAthletes) {
                renderAthletesTable(cachedAthletes.rows);
                renderPagination(cachedAthletes.total_pages, cachedAthletes.current_page);
            } else {
                loadAthletes(1).then(data => {
                    cachedAthletes = data;
                });
            }
        }
    });



    document.getElementById('openModalBtn').addEventListener('click', function () {
        $('#addInfoModal').modal('show');
    });


});
function handleAddAthlete(event) {
    event.preventDefault(); // prevent the default form submission

    const payload = new URLSearchParams({
        athleteName: document.getElementById('athleteName').value,
        athleteNumeroCC: document.getElementById('athleteNumeroCC').value,
        athleteDateBirth: document.getElementById('athleteDateBirth').value,
        athleteEmail: document.getElementById('athleteEmail').value,
        athletePhone: document.getElementById('athletePhone').value,
        athleteAssId: document.getElementById('athleteAssId').value
    });

    console.log('Processing add athlete request...');

    fetch('/api/inscritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                $('#addInfoModal').modal('hide');
                history.replaceState({}, document.title, window.location.pathname);
                loadAthletes(1);
            } else {
                console.error('Server error:', data.message);
            }
        })
        .catch(error => console.error('Error adding athlete:', error));

    return false; // just in case it's called from inline onsubmit
}


function loadAthletes(page) {
    return fetch(`/api/inscritos?page=${page}`)
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            //console.log(data.rows);
            renderAthletesTable(data.rows);
            renderPagination(data.total_pages, data.current_page);
        })
        .catch(error => console.error('Error fetching athletes:', error));
}

function renderAthletesTable(athletes) {

    const tbody = document.getElementById('athletesTableBody');



    tbody.innerHTML = '';
    if (athletes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No athletes found.</td></tr>';
        return;
    }

    athletes.forEach(athlete => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${athlete[0]}</td>
            <td>${athlete[1]}</td>
            <td>
                <a href="/edit-athlete/${athlete.id}" title="Edit">
                    <i class="fas fa-edit"></i>
                </a>
                <a href="#" id="delete-athlete" data-id="${athlete.id}" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </a>

            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPagination(totalPages, currentPage) {
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const createPageItem = (label, page, isDisabled = false, isActive = false) => {
        const li = document.createElement('li');
        li.classList.add('page-item');
        if (isDisabled) li.classList.add('disabled');
        if (isActive) li.classList.add('active');
        const a = document.createElement('a');
        a.classList.add('page-link');
        a.href = '#';
        a.textContent = label;
        a.addEventListener('click', function (e) {
            e.preventDefault();
            loadAthletes(page);
        });
        li.appendChild(a);
        return li;
    };

    if (currentPage > 1) {
        pagination.appendChild(createPageItem('<<', 1));
        pagination.appendChild(createPageItem('<', currentPage - 1));
    }

    for (let i = 1; i <= totalPages; i++) {
        pagination.appendChild(createPageItem(i, i, false, i === currentPage));
    }

    if (currentPage < totalPages) {
        pagination.appendChild(createPageItem('>', currentPage + 1));
        pagination.appendChild(createPageItem('>>', totalPages));
    }
}

function loadAssociations() {
    fetch('/api/associacoes')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('athleteAssId');
            select.innerHTML = '<option value="">Select Association</option>';
            data.rows.forEach(association => {
                const option = document.createElement('option');
                option.value = association[0];
                option.textContent = association[1];
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching associations:', error));
}
