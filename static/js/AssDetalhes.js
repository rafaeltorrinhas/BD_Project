document.addEventListener("DOMContentLoaded", function () {
  // Handle medal deletion
  document.querySelectorAll(".delete-medal").forEach((button) => {
    button.addEventListener("click", function () {
      if (confirm("Tem certeza que deseja remover esta medalha?")) {
        const assId = this.dataset.assId;
        const modalidade = this.dataset.modalidade;
        const tipoMedalha = this.dataset.medalId;
        const ano = this.dataset.ano;

        fetch(`/api/ass/${assId}/medalhas`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modalidade: modalidade,
            ano: ano,
            tipoMedalha: tipoMedalha,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === "success") {
              location.reload();
            } else {
              alert("Erro ao remover medalha: " + data.message);
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("Erro ao remover medalha");
          });
      }
    });
  });

  document.querySelectorAll(".delete-team").forEach((button) => {
    button.addEventListener("click", function () {
      if (confirm("Tem certeza que deseja remover esta equipa?")) {
        const teamId = this.dataset.teamId;
        console.log("Deleting team with ID:", teamId);  // Debug log
        
        fetch(`/api/ass/${teamId}/teams`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            location.reload();
          } else {
            alert("Erro ao remover equipa: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Erro ao remover equipa");
        });
      }
    });
  });

  // Handle medal addition
  document.getElementById("saveMedal").addEventListener("click", function () {
    const form = document.getElementById("addMedalForm");
    const assId = document.getElementById("assId").value;
    const modalidade = document.getElementById("modalidade").value;
    const tipoMedalha = document.getElementById("tipoMedalha").value;
    const ano = document.getElementById("ano").value;

    if (!modalidade || !tipoMedalha || !ano) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    fetch(`/api/ass/${assId}/medalhas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modalidade: modalidade,
        tipoMedalha: tipoMedalha,
        ano: ano,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          location.reload();
        } else {
          alert("Erro ao adicionar medalha: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Erro ao adicionar medalha");
      });
  });

  // Add Team functionality
  $('#teamModalidade').change(function() {
    const assId = $('#assId').val();
    const modalidade = $(this).val();
    loadPlayersForModalidade(modalidade);
  });

  function loadPlayersForModalidade(modalidade) {
    const assId = $('#assId').val();
    $.ajax({
      url: `/api/AssInscritos/ATLETA/${assId}`,
      method: 'GET',
      success: function(response) {
        console.log('Players data:', response); // Debug log
        
        $('#teamPlayers').empty();
        if (response.rows.length === 0) {
          $('#teamPlayers').append(new Option('Nenhum jogador disponível', ''));
        } else {
          response.rows.forEach(player => {
            const modalidades = player[2] || '';
            const option = new Option(player[1], player[0]);
            option.title = `Modalidades: ${modalidades}`; // Add tooltip with modalidades
            $('#teamPlayers').append(option);
          });
        }
        $('#teamPlayers').trigger('change');
      },
      error: function(xhr, status, error) {
        console.error('Error loading players:', error);
        alert('Erro ao carregar jogadores. Por favor, tente novamente.');
      }
    });
  }

  $('#saveTeam').click(function() {
    const assId = $('#assId').val();
    const modalidade = $('#teamModalidade').val();
    const players = $('#teamPlayers').val();

    if (!modalidade) {
      alert('Por favor, selecione uma modalidade.');
      return;
    }

    $.ajax({
      url: `/api/ass/${assId}/teams`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        modalidade: parseInt(modalidade),
        players: players || []
      }),
      success: function(response) {
        if (response.status === 'success') {
          $('#addTeamModal').modal('hide');
          location.reload();
        } else {
          alert('Erro ao adicionar equipa: ' + response.message);
        }
      },
      error: function(xhr, status, error) {
        alert('Erro ao adicionar equipa: ' + error);
      }
    });
  });

  loadAthletesAss();
  loadTreinadorAss();
  loadArbitroAss();
});

function loadAthletesAss() {
  const assId = document.getElementById("assId").value;
  fetch(`/api/AssInscritos/ATLETA/${assId}`)
    .then((response) => response.json())
    .then((data) => {
      const list = document.getElementById("Athlete-list");
      list.innerHTML = "";

      data.rows.forEach((row) => {
        const li = document.createElement("li");
        li.textContent = row[1];
        list.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading athletes:", error);
    });
}

function loadTreinadorAss() {
  const assId = document.getElementById("assId").value;
  fetch(`/api/AssInscritos/TREINADOR/${assId}`)
    .then((response) => response.json())
    .then((data) => {
      const list = document.getElementById("Treinador-list");
      list.innerHTML = "";

      data.rows.forEach((row) => {
        const li = document.createElement("li");
        li.textContent = row[1];
        list.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading athletes:", error);
    });
}

function loadArbitroAss() {
  const assId = document.getElementById("assId").value;
  fetch(`/api/AssInscritos/ARBITRO/${assId}`)
    .then((response) => response.json())
    .then((data) => {
      const list = document.getElementById("arbitro-list");
      list.innerHTML = "";

      data.rows.forEach((row) => {
        const li = document.createElement("li");
        li.textContent = row[1];
        list.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error loading athletes:", error);
    });
}
