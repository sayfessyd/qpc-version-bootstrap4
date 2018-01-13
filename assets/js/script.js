var socket;
var partie;
var joueur;
var count;
var score;
var countdown;
var indiceInterval;

playGenerique();

function reset() {
	clearInterval(countdown);
	clearInterval(indiceInterval);
	$('#indices').text("");
	$('#envoyer').prop('disabled', true);
	$('#buzzer').prop('disabled', false);
	$("#buzzer-msg").css("display", "none");
	$("#count").removeClass('badge-danger');
}

function setCountdown() {
	count = partie.start;
	$('#count span').text(count);
	playLoopMusic();
	countdown = setInterval(function () {
		if (count != 0) {
			count--;
			$('#count span').text(count);
		} else {
			pauseLoop();
			playDingdong();
			reset();
			socket.emit('questionSuiv');
		}
	}, 1000);
}

$('#buzzer').on("click", function () {
	socket.emit('buzz');
	$('#envoyer').prop('disabled', false);
	$('#buzzer').prop('disabled', true);
	$("#count").addClass('badge-danger');
	playBuzz();
});

$('#envoyer').on("click", function () {
	var reponse = $("#reponse").val();
	socket.emit('reponse', {
		reponse: reponse
	});
	$('#envoyer').prop('disabled', true);
	$("#count").removeClass('badge-danger');
});

$('#jeuModal').on('hide.bs.modal', function (e) {
	socket.disconnect();
});

socket = io.connect('http://localhost:90');
socket.on('refresh', function () {
	location.reload();
});

$('#jeuModal').on('show.bs.modal', function (e) {
	socket.emit('init');
	socket.on('joueur', function (data) {
		joueur = data;
		console.info(data);
	});
	socket.on('partie', function (data) {
		partie = data;
		console.info(data);
		score = 0;
		$("#score span").text(score);
	});
	socket.on('question', function (data) {
		$('#jeuModalLabel div').text(data.question.content);
		$("#reponse").val("");
		$('#buzzer').prop('disabled', false);
		setCountdown();
		var indice = data.question.indices.pop();
		$('#indices').append(' #' + indice);
		indiceInterval = setInterval(function () {
			indice = data.question.indices.pop();
			if (indice != undefined) {
				$('#indices').append(' #' + indice);
			} else {
				clearInterval(indiceInterval);
			}
		}, 5000);
	});
	socket.on('stop', () => {
		$('#envoyer').prop('disabled', true);
		$('#buzzer').prop('disabled', true);
		$("#buzzer-msg").css("display", "block");
	});
	socket.on('release', () => {
		$('#envoyer').prop('disabled', true);
		$('#buzzer').prop('disabled', false);
		$("#buzzer-msg").css("display", "none");
	});
	socket.on('finBuzzer', function (data) {
		$("#count").removeClass('badge-danger');
		$('#envoyer').prop('disabled', true);
		playLoopMusic();
	});
	socket.on('succes', (data) => {
		score = data;
		$("#score span").text(score);
		reset();
	});
	socket.on('fail', () => {
		reset();
	});
	socket.on('no', () => {
		playPerdu();
	});
	socket.on('fin', () => {
		$('.modal-title').text("Le jeu est terminé !");
		$('.modal-body').text("");
		$('#buzzer').prop('disabled', true);
		clearInterval(countdown);
		clearInterval(indiceInterval);
		socket.emit('score', {
			score: score,
			joueur: joueur
		});
	});
	socket.on('gagnant', (data) => {
		if (data.id != joueur.id) {
			$('.modal-body').text("Le joueur " + data.id + " a gagné la partie !");
			pauseAll();
		} else {
			$('.modal-body').text("Félicitations tu as gagné la partie avec un score égale à " + score + " !!");
			playDingApplause();
		}
	});
	socket.on('score0', () => {
		$('.modal-body').text("Aucun joueur n'a gagné la partie !");
		pauseAll();
	});
	socket.on('disconnect', () => {
		$('.modal-body').text("You are disconnected...");
		clearInterval(countdown);
		clearInterval(indiceInterval);
		location.reload();
	});
	$(document).keypress(function (e) {
		if (e.which == 13) {
			e.preventDefault();
			$("#envoyer").click();
		}
	});
});