document.addEventListener("DOMContentLoaded", function () {
    loadRanking();
});

function loadRanking() {
    fetch('/api/ranking')
        .then(response => response.json())
        .then(data => {
            const rankingTable = document.getElementById('rankingTable');
            rankingTable.innerHTML = '';

            data.rows.forEach((row, index) => {
                const tr = document.createElement('tr');

                // Position column
                const tdPosition = document.createElement('td');
                tdPosition.textContent = index + 1;
                if (index === 0) {
                    tdPosition.innerHTML = '<i class="fas fa-crown text-warning"></i> 1';
                } else if (index === 1) {
                    tdPosition.innerHTML = '<i class="fas fa-medal text-secondary"></i> 2';
                } else if (index === 2) {
                    tdPosition.innerHTML = '<i class="fas fa-medal text-danger"></i> 3';
                }
                tr.appendChild(tdPosition);

                // Team column
                const tdTeam = document.createElement('td');
                tdTeam.textContent = row[1]; // Team name
                tr.appendChild(tdTeam);

                // Games won column
                const tdGames = document.createElement('td');
                tdGames.textContent = row[2]; // Games won
                tr.appendChild(tdGames);

                rankingTable.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('Error loading ranking:', error);
            alert('Erro ao carregar o ranking. Por favor, tente novamente.');
        });
} 