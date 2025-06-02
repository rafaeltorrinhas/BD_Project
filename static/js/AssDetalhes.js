document.addEventListener('DOMContentLoaded', function () {
    // Handle medal deletion
    document.querySelectorAll('.delete-medal').forEach(button => {
        button.addEventListener('click', function () {
            if (confirm('Tem certeza que deseja remover esta medalha?')) {
                const assId = this.dataset.assId;
                const modalidade = this.dataset.modalidade;
                const ano = this.dataset.ano;

                fetch(`/api/ass/${assId}/medalhas`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        modalidade: modalidade,
                        ano: ano
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            location.reload();
                        } else {
                            alert('Erro ao remover medalha: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Erro ao remover medalha');
                    });
            }
        });
    });

    // Handle medal addition
    document.getElementById('saveMedal').addEventListener('click', function () {
        const form = document.getElementById('addMedalForm');
        const assId = document.getElementById('assId').value;
        const modalidade = document.getElementById('modalidade').value;
        const tipoMedalha = document.getElementById('tipoMedalha').value;
        const ano = document.getElementById('ano').value;

        if (!modalidade || !tipoMedalha || !ano) {
            alert('Por favor, preencha todos os campos');
            return;
        }

        fetch(`/api/ass/${assId}/medalhas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                modalidade: modalidade,
                tipoMedalha: tipoMedalha,
                ano: ano
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    location.reload();
                } else {
                    alert('Erro ao adicionar medalha: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Erro ao adicionar medalha');
            });
    });

    loadAthletesAss()
    loadTreinadorAss()
    loadArbitroAss()


});


function loadAthletesAss() {
    const assId = document.getElementById('assId').value;
    fetch(`/api/AssInscritos/ATLETA/${assId}`)
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("Athlete-list");
            list.innerHTML = '';  // Clear any existing list items

            data.rows.forEach(row => {
                // row[1] is typically the athlete name (depending on your server-side query)
                const li = document.createElement('li');
                li.textContent = row[1];  // Adjust index if needed
                list.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading athletes:', error);
        });
}
function loadTreinadorAss() {
    const assId = document.getElementById('assId').value;
    fetch(`/api/AssInscritos/TREINADOR/${assId}`)
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("Treinador-list");
            list.innerHTML = '';  // Clear any existing list items

            data.rows.forEach(row => {
                // row[1] is typically the athlete name (depending on your server-side query)
                const li = document.createElement('li');
                li.textContent = row[1];  // Adjust index if needed
                list.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading athletes:', error);
        });
}
function loadArbitroAss() {
    const assId = document.getElementById('assId').value;
    fetch(`/api/AssInscritos/ARBITRO/${assId}`)
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById("arbitro-list");
            list.innerHTML = '';  // Clear any existing list items

            data.rows.forEach(row => {
                // row[1] is typically the athlete name (depending on your server-side query)
                const li = document.createElement('li');
                li.textContent = row[1];  // Adjust index if needed
                list.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading athletes:', error);
        });
}