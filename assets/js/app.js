var sounds = document.querySelectorAll('.sound');
var loopMusic = document.getElementById('loop-music');
var buzz = document.getElementById('buzz');
var perdu = document.getElementById('perdu');
var ding_applause = document.getElementById('ding-applause');
var dingdong = document.getElementById('dingdong');
var generique = document.getElementById('generique');

function pauseAll() {
  sounds.forEach(function (sound) {
    sound.pause();
    sound.currentTime = 0;
  });
  pauseLoop();
}

function pauseLoop() {
  loopMusic.pause();
  loopMusic.currentTime = 0;
}

function playBuzz() {
  pauseAll();
  buzz.volume = 0.2;
  buzz.play();
}

function playPerdu() {
  pauseAll();
  perdu.volume = 0.2;
  perdu.play();
}

function playDingApplause() {
  pauseAll();
  ding_applause.volume = 0.2;
  ding_applause.play();
}

function playDingdong() {
  pauseAll();
  dingdong.volume = 0.2;
  dingdong.play();
}

function playGenerique() {
  pauseAll();
  generique.volume = 0.2;
  generique.play();
}

function playLoopMusic() {
  pauseAll();
  loopMusic.loop = true;
  loopMusic.volume = 0.2;
  loopMusic.play();
}