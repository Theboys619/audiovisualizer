// // // Launchpad Initialization // // //
const socket = io("localhost:65515");
const launchpad = new Launchpad("Launchpad MK2", true);

launchpad.getDevice();

launchpad.on("DeviceReady", function(data) {
	alert("Device Ready!");
});

// // // Other schnitzel // // //
let playb = document.getElementById("play");

let playing = false;

let sound;
let fft;

playb.addEventListener("click", toggle);

function toggle() {
	if (sound.isPlaying()) {
		playing = false;
    sound.pause();
    playb.innerText = "Play";
	} else {
		playing = true;
    sound.play();
    if (sound.isPlaying()) {
      playb.innerText = "Pause";
    }
	}
}

function songselect() {
  socket.emit("SongScan");
}

socket.on("Songs", function(path, songs) {
  console.log(path);
  songs.forEach(function(song, index) {
    let songlist = document.getElementById("songlist");
    let songname = song.substring(0, song.indexOf("="));
    songlist.innerHTML += "<a href='#' onclick=" + `"playsong('${songname}', '${song}', ${index})">` + `${songname}</a><br>`;
  });
});

// // / / p5.js // // //
let canv;
let audioSignal;
let slash = false;
let playonlaunchpad = false;

function setup() {
  canv = createCanvas(1920,1080);
  frameRate(120);
  colorMode(HSB);
}
let fft2;
function draw() {
  background(0);
  if (sound) {
    if (sound.isPlaying()) {
      let spectrum = fft.analyze();
      let w = width / 512
			let start = 0;

      for (let i = start; i < spectrum.length; i++) {
        let amp = spectrum[i]*(height/255);
        let y = map(amp, 0, width, height, 0);
				if (start < 1) {
					fill(i, 67, 130);
	        rect(i*w, y, w-2/*i*w*/, height-y);
				} else {
					fill(i-start, 67, 130);
	        rect((i-start)*w, y, w-2, height-y);
				}
      }
    }
  } else if (slash) {
    let spectrum = fft2.analyze();
    let w = width / 512
		let start = 0;

    for (let i = start; i < spectrum.length; i++) {
      let amp = spectrum[i]*(height/255);
      let y = map(amp, 0, width, height, 0);
			if (start < 1) {
				fill(i, 67, 130);
				rect(i*w, y, w-2/*i*w*/, height-y);
			} else {
				fill(i-start, 67, 130);
				rect((i-start)*w, y, w-2, height-y);
			}
    }
  }
	// if (playonlaunchpad) {
	// 	launchpad.resetLeds();
	// 	let spectrum;
	// 	let w = 8;
	// 	let h = 8;
	// 	let start = 75;
	// 	let end = start + w;
	//
	// 	if (slash) {
	// 		fft2.smoothing = 0.2;
	// 		spectrum = fft2.analyze();
	// 	} else if (sound) {
	// 		fft.smoothing = 0.2;
	// 		spectrum = fft.analyze();
	// 	}
	//
	// 	for (let i = start; i < end; i++) {
	// 		let amp = spectrum[i];
	// 		let y = map(amp, 0, w, h, 0);
	// 		y = Math.round(Math.abs(y/(h*4)));
	//
	// 		if (start < 1) {
	// 			launchpad.rect(i, i, h-y, i, h);
	// 		} else {
	// 			launchpad.rect(i, i-start, h-y, i-start, h);
	// 		}
	// 	}
	// }
}
let fft3;
let launchplay;
function launchdraw() {
	if (playonlaunchpad) {
		launchpad.resetLeds();
		let spectrum = fft3.analyze();
		let w = 8;
		let h = 8;
		let start = 75;
		let end = start + w;

		for (let i = start; i < end; i++) {
			let amp = spectrum[i];
			let y = map(amp, 0, w, h, 0);
			y = Math.round(Math.abs(y/(h*4)));

			if (start < 1) {
				launchpad.rect(i, i, h-y, i, h);
			} else {
				launchpad.rect(i, i-start, h-y, i-start, h);
			}
		}
	}
}

function playsong(songname, song, index) {
  slash = false;
  sound = loadSound(`/songs/${song}`, success, fail);
  fft = new p5.FFT(0.8, 1024);
  document.getElementById('selectedsong').innerHTML = "Selected Song: " + songname;
}

function success(data) {
	toggle();
}

function fail(data) {
	alert(`Error: ${data}`);
}

let fs;
function mousePressed() {
  if (mouseX > 0 && mouseX < height && mouseY > 0 && mouseY < width) {
    fs = fullscreen();
    fullscreen(!fs);
    if (!fs) {
      document.body.style = "overflow: hidden;";
      window.scrollTo(8,304)
    } else if (fs) {
      document.body.style = "";
      window.scrollTo(0,0);
    }
  }
}
function keyPressed() {
  if (keyCode == 32) {
    toggle();
  } else if (keyCode == 27) {
    if (!fs) {
      fs = !fs;
      document.body.style = "";
    }
  } else if (keyCode == 191) {
    fft2 = new p5.FFT(0.8, 1024);

    audioSignal = new p5.AudioIn();
    audioSignal.getSources().then(function(sources) {
      console.log(sources);
      audioSignal.setSource(0);
    });
    audioSignal.start();
    fft2.setInput(audioSignal);

    document.getElementById('selectedsong').innerHTML = "Selected Song: Desktop Audio";
    console.log("Launched");
    if (slash) {
      slash = false
    } else {
      slash = true;
    }
  } else if (keyCode == 39) {
		if (playonlaunchpad) {
			playonlaunchpad = false;
			fft3 = '';
		} else {
			playonlaunchpad = true;
			fft3 = new p5.FFT(0.2, 1024);
			if (slash) {
				audioSignal = new p5.AudioIn();
		    audioSignal.getSources().then(function(sources) {
		      console.log(sources);
		      audioSignal.setSource(0);
		    });
		    audioSignal.start();
		    fft3.setInput(audioSignal);
				document.getElementById('selectedsong').innerHTML = "Selected Song: Desktop Audio on Launchpad";
			}
			
			launchplay = setInterval(launchdraw, 1000/16)

		}
		alert(`Launchpad?: ${playonlaunchpad}`);
	}
}
