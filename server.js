var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
utils = require('./utils');

server.listen(90);

app.use('/assets', express.static('assets'));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies

var fin = false;

app.get('/', function (req, res) {
	var label;
	if (partie_obj == undefined) {
		label = 'Créer une nouvelle partie';
	} else {
		if (fin == true) {
			label = 'Veuillez redémarrer le serveur';
		} else {
			label = 'Rejoindre La partie ' + partie_obj.id;
		}
	}
	res.render('index', {
		button_label: label
	});
});

app.get('/config', function (req, res) {
	res.render('config', {
		start: struct.start,
		max_joueurs: struct.max_joueurs,
		points: struct.points,
		buzzer_timer: struct.buzzer_timer
	});
});

app.post('/config', function (req, res) {
	struct.start = req.body.start;
	struct.max_joueurs = req.body.max_joueurs;
	struct.points = req.body.points;
	struct.buzzer_timer = req.body.buzzer_timer;
	res.redirect('/');
});

app.post('/question', function (req, res) {
	var question = {
		content: req.body.question,
		indices: [req.body.indice1, req.body.indice2, req.body.indice3],
		reponse: req.body.reponse
	};
	struct.questions.push(question);
	res.redirect('/');
});

var tab = [{
		content: 'Capitale Européenne ?',
		indices: ['grande', 'froide', 'francophone'],
		reponse: 'paris'
	},
	{
		content: 'Capitale Africaine ?',
		indices: ['grande', 'royaume-uni', 'sud'],
		reponse: 'pretoria',
	},
	{
		content: 'Capitale Américaine ?',
		indices: ['grande', 'populaire', 'nord'],
		reponse: 'new york'
	},
	{
		content: 'Capitale Asiatique ?',
		indices: ['grande', 'froide', 'nord'],
		reponse: "moscou"
	},
	{
		content: 'Capitale Mondiale ?',
		indices: ['grande', 'populaire', 'Européenne'],
		reponse: "berlin"
	}
];

const questions = function () {
	return tab;
}

const joueur = function () {
	return {
		id: Math.floor(Math.random() * 1000) + 1,
	}
}

var struct = {
	id: Math.floor(Math.random() * 1000) + 1,
	owner: joueur,
	start: 20,
	points: 10,
	buzzer_timer: 5,
	joueurs: [
		joueur
	],
	max_joueurs: 4,
	questions: new questions
};

const partie = function (joueur) {
	return struct;
}

function next(socket) {
	if (partie_obj.questions.length > 0) {
		question = partie_obj.questions.pop();
		socket.broadcast.emit('question', {
			question: question
		});
		socket.emit('question', {
			question: question
		});
	} else {
		socket.broadcast.emit('fin');
		socket.emit('fin');
	}
}

var partie_obj;
var question;
var gagnant;
var count = 0;
var max_score = 0;

//Mélanger les questions
utils.shuffle(questions);

io.on('connection', function (socket) {
	socket.on('init', function (data) {
		var joueur_obj;
		if (partie_obj == undefined) {
			joueur_obj = new joueur;
			partie_obj = new partie(joueur_obj);
			socket.broadcast.emit('refresh');
		} else {
			joueur_obj = new joueur;
			partie_obj.joueurs.push(joueur_obj);
		}
		socket.emit('joueur', joueur_obj);
		//Initialisation par les clients, le dernier est celui qui fait commencer la partie.
		if (partie_obj.joueurs.length == partie_obj.max_joueurs) {
			socket.broadcast.emit('partie', partie_obj);
			socket.emit('partie', partie_obj);
			question = partie_obj.questions.pop();
			socket.broadcast.emit('question', {
				question: question
			});
			socket.emit('question', {
				question: question
			});
		}
	});
	//Demande de la question suivante par les clients, le dernier demandeur est celui qui envoit la question aux clients.
	socket.on('questionSuiv', function () {
		clearTimeout(timeout);
		count++;
		if (count == partie_obj.max_joueurs) {
			next(socket);
			count = 0;
		}
	});
	var timeout;
	socket.on('buzz', function () {
		socket.broadcast.emit('stop');
		timeout = setTimeout(() => {
			socket.broadcast.emit('release');
			socket.emit('finBuzzer');
		}, parseInt(partie_obj.buzzer_timer) * 1000);
	});
	//Decider si la reponse est juste => envoyer un succes au client qui a répondu et un fail aux autres clients.
	var score = 0;
	socket.on('reponse', function (data) {
		clearTimeout(timeout);
		socket.broadcast.emit('release');
		if (data.reponse == question.reponse) {
			socket.broadcast.emit('fail');
			score += parseInt(partie_obj.points);
			socket.emit('succes', score);
			next(socket);
		} else {
			socket.emit('no');
		}
	});
	//Calcul du score gagnant, le dernier qui envoit son score est celui qui envoit l'identité du gagnant aux clients.
	socket.on('score', function (data) {
		clearTimeout(timeout);
		socket.emit('stop');
		count++;
		if (max_score <= data.score) {
			max_score = data.score;
			gagnant = data.joueur;
		}
		if (partie_obj != undefined) {
			if (count == partie_obj.max_joueurs) {
				if (max_score != 0) {
					socket.broadcast.emit('gagnant', gagnant);
					socket.emit('gagnant', gagnant);
				} else {
					socket.broadcast.emit('score0');
					socket.emit('score0');
				}
				count = 0;
				fin = true;
			}
		}
	});
	socket.on('disconnect', function () {

	});
});