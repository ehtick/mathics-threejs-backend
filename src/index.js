import drawGraphics3d from './graphics3d.js';

function translationLayer(div, object) {
	if (object.protocol) {
		// protocol version is X.Y, so it is an array of two elements: major version and minor version
		const versionArray = object.protocol.match(/\d/g);

		if (parseInt(versionArray[0]) !== 1) {
			const warning = document.createElement('p');

			warning.style.color = 'yellow';
			warning.innerText = `The major revision version of mathics-threejs-backend is 1, but it was expected to be ${versionArray[0]}. Trying to draw the graphics.`;

			div.appendChild(warning);
		} else if (parseInt(versionArray[1]) < 1) {
			// The code bellow need to be commented in 1.0, 2.0, 3.0, ...
			// as the number can't be smaller than 0.

			const warning = document.createElement('p');

			warning.style.color = 'yellow';
			warning.innerText = `The minor revision version of mathics-threejs-backend is 1, but it was expected to be ${versionArray[1]}. Trying to draw the graphics.`;

			div.appendChild(warning);
		}
	}

	object.elements?.forEach((primitive) => {
		if (primitive.faceColor) {
			primitive.color = primitive.faceColor;
		}

		primitive.color = primitive.color.slice(0, 3);
	});

	object.lighting?.forEach((light) => {
		if (light.position) {
			light.coords = [light.position];
		}

		light.type = light.type.toLowerCase();
	});

	return drawGraphics3d(div, object);
}

window.drawGraphics3d = translationLayer;

export default drawGraphics3d;
