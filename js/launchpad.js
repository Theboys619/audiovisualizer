var LaunchGrid = [
	[104, 105, 106, 107, 108, 109, 110, 111, 0],
	[81, 82, 83, 84, 85, 86, 87, 88, 89],
	[71, 72, 73, 74, 75, 76, 77, 78, 79],
	[61, 62, 63, 64, 65, 66, 67, 68, 69],
	[51, 52, 53, 54, 55, 56, 57, 58, 59],
	[41, 42, 43, 44, 45, 46, 47, 48, 49],
	[31, 32, 33, 34, 35, 36, 37, 38, 39],
	[21, 22, 23, 24, 25, 26, 27, 28, 29],
	[11, 12, 13, 14, 15, 16, 17, 18, 19]
]

let self;

class Launchpad {
	constructor(devicename = "", sysex = false) {
		this.deviceName = devicename;
		this.sysex = sysex;
		this.launchon = false;

		this.output = null;
		this.input = null;

		self = this;

		this.listeners = [];

		this.LaunchGrid = LaunchGrid;
	}

	emit(message = "", arg = "") {
		let args = { detail: [] };
		args.detail.push(arg);
		let event = new CustomEvent(message, args);
		document.dispatchEvent(event);
	}

	on(message, callback) {
		document.addEventListener(message, callback, false);
	}

	getDevice() {
		let inputs, outputs, input, output;

		return navigator.requestMIDIAccess({sysex: this.sysex}).then(function(access){
			inputs = Array.from(access.inputs.values());
			outputs = Array.from(access.outputs.values());

			for (let i = 0; i < inputs.length; i++) {
				input = inputs[i];

				for (let j = 0; j < outputs.length; j++) {
					output = outputs[j];

					if (input.name === self.deviceName && input.name === output.name && input.type === 'input' && output.type === 'output') {
						self.input = input;
						self.output = output;
						self.launchon = true;
						self.emit("DeviceReady");
						self.input.onmidimessage = self.getMidiMessage;
						return this;
					}
				}
			}
			throw new Error(`Device ${self.deviceName} was not initialized`);
		});

		throw new Error(`The device ${this.deviceName} was not found!`);
	}

	getMidiMessage(e) {
		let data = e.data;
		let cmd = data[0];
		let note = data[1];
		let vel = data[2];

		switch (cmd) {
			case 144:
				if (vel > 0) {
					self.emit("KeyDown", note, vel);
				} else {
					self.emit("KeyUp", note, vel);
				}
				break;
			case 176:
				if (note >= 104) {
					if (vel > 0) {
						self.emit("KeyDown", note, vel);
					} else {
						self.emit("KeyUp", note, vel);
					}
				}
				break;
			case 128:
				self.emit("KeyUp", note, vel);
				break;
		}
	}

	// All Midi Cmds start with 240, 00, 32, 41, 2, 24 then 6th byte ended with 247

	LedOn(led, color, g, b) {
		if (b) {
			this.output.send([240, 0, 32, 41, 2, 24, 11, color, g, b, 247]);
		} else {
			if (led >= 104) {
				this.output.send([176, led, color]);
			} else {
				this.output.send([144, led, color]);
			}
		}

	}

	LedOff(led) {
		if (led >= 104) {
			this.output.send([176, led, 0]);
		} else {
			this.output.send([144, led, 0]);
		}
	}

	setColumn(column, color) {
		if (this.sysex) {
			if (column > 8 || column < 0) {
				throw new Error(`Column number should be between 0-8! Column number is: ${column}`);
			}
			this.output.send([240, 0, 32, 41, 2, 24, 12, column, color]);
		} else {
			throw new Error("Failed to set Column! Sysex is not Enabled!");
		}
	}

	setRow(row, color) {
		if (this.sysex) {
			if (row > 8 || row < 0) {
				throw new Error(`Row number should be between 0-8! Row number is: ${row}`);
			}
			this.output.send([240, 0, 32, 41, 2, 24, 12, row, color]);
		} else {
			throw new Error("Failed to set Row! Sysex is not Enabled!");
		}
	}

	PulseLed(led, color) {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 40, led, color, 247]);
		} else {
			throw new Error("Failed to Pulse Led! Sysex is not Enabled!");
		}
	}

	FlashLed(led, flashingcolor, startingcolor, g, b) {
		if (this.sysex) {
			if (b) {
				this.LedOn(led, startingcolor, g, b);
			} else {
				this.LedOn(led, startingcolor);
			}
			this.output.send([240, 0, 32, 41, 2, 24, 35, led, flashingcolor]);
		}
	}

	//(240, 0, 32, 41, 2, 24, 20, <Colour> <Loop> <Text> 247)
	TextOn(text, color, loop) {
		if (this.sysex) {
			let cmd = [240, 0, 32, 41, 2, 24, 20, color, loop];

			for (let i in text) {
				cmd.push(text.charCodeAt(i));
			}
			cmd.push(247);

			this.output.send(cmd);
		} else {
			throw new Error("Failed to Scroll Text! Sysex is not Enabled!");
		}
	}

	TextOff() {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 20, 247]);
		} else {
			throw new Error("Failed to end Text Scroll! Sysex is not Enabled!");
		}
	}

	// old
	// resetLeds() {
	// 	for (let i = 0; i < LaunchGrid.length; i++) {
	// 		for (let j = 0; j < LaunchGrid[0].length; j++) {
	// 			let led = LaunchGrid[i][j];
	//
	// 			if (led >= 104) {
	// 				this.output.send([176, led, 0]);
	// 			} else {
	// 				this.output.send([144, led, 0]);
	// 			}
	//
	// 		}
	// 	}
	// }

	rect(color = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
		for (let y = y1; y <= y2; y++) {
			for (let x = x1; x <= x2; x++) {
				let led = LaunchGrid[y][x];
				
				this.LedOn(led, color);
			}
		}
	}

	setLeds(color) {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 14, color, 247]);
		} else {
			throw new Error("Failed to set Leds! Sysex is not Enabled!");
		}
	}

	resetLeds() {
		if (this.sysex) {
			this.output.send([240, 0, 32, 41, 2, 24, 14, 0, 247]);
		} else {
			throw new Error("Failed to Reset Leds! Sysex is not Enabled!");
		}
	}
}
