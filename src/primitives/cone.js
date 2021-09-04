import {
	BufferAttribute,
	CylinderGeometry,
	Group,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	Line,
	Mesh,
	ShaderMaterial,
	UniformsLib
} from '../../vendors/three.js';

import { get2PopulatedCoordinateBuffers } from '../bufferUtils.js';

// See https://reference.wolfram.com/language/ref/Cone
// for the high-level description of what is being rendered.
export default function ({ color, coords, edgeForm = {}, opacity = 1, radius = 1 }, extent) {
	const [coneBases, coneTips] = get2PopulatedCoordinateBuffers(coords, extent);

	const coneGeometry = new InstancedBufferGeometry().copy(
		new CylinderGeometry(radius, 0, 1, 24)
			.translate(0, -0.5, 0) // translate the geometry so we don't need to calculate the middle of each coordinates-pair
			.rotateX(Math.PI / 2) // rotate the cone 90 degrees to lookAt work
	);

	coneGeometry.instanceCount = coords.length / 2;

	coneGeometry.setAttribute(
		'coneBase',
		new InstancedBufferAttribute(coneBases, 3)
	);

	coneGeometry.setAttribute(
		'coneTip',
		new InstancedBufferAttribute(coneTips, 3)
	);

	const cones = new Mesh(
		coneGeometry,
		new ShaderMaterial({
			transparent: opacity !== 1,
			depthWrite: opacity === 1,
			lights: true,
			uniforms: {
				...UniformsLib.lights,
				diffuse: { value: color },
				opacity: { value: opacity }
			},
			vertexShader: `
				attribute vec3 coneBase;
				attribute vec3 coneTip;

				varying vec3 vLightFront;
				varying vec3 vIndirectFront;

				#include <common>
				#include <bsdfs>
				#include <lights_pars_begin>

				void main() {
					vec3 z = normalize(coneBase - coneTip);
					// if z.z is 0 the cone doesn't appear
					z.z += 0.0001;

					vec3 x = normalize(cross(vec3(0, 1, 0), z));
					vec3 y = cross(z, x);

					float height = distance(coneBase, coneTip);

					// position, rotate and scale the cone
					mat4 coneMatrix = mat4(
						x, 0,            // row 0
						y, 0,            // row 1
						z * height, 0,   // row 2
						coneBase, 1 // row 3
					);

					vec4 mvPosition = modelViewMatrix * coneMatrix * vec4(position, 1);

					gl_Position = projectionMatrix * mvPosition;

					vec3 transformedNormal = normalMatrix * normal;

					#include <lights_lambert_vertex>
				}
			`,
			fragmentShader: `
				uniform vec3 diffuse;
				uniform float opacity;

				varying vec3 vLightFront;
				varying vec3 vIndirectFront;

				#include <common>
				#include <bsdfs>

				void main() {
					gl_FragColor = vec4(
						(vLightFront + vIndirectFront) * BRDF_Lambert(diffuse),
						opacity
					);
				}
			`
		})
	);

	cones.frustumCulled = false;

	if (edgeForm.showEdges === false) {
		// If the edges aren't shown the work is done.
		return cones;
	}

	const group = new Group();

	group.add(cones);

	// Differently from cuboid's edges, the cones' ones are in a different object. It is very hard or maybe impossible to draw edges with complex shapes in the fragment shader.

	// The lines below are the cone base edges' vertices' positions.
	// The magic numbers below are modified from the position attribute of a three.js EdgesGeometry of the cone.
	// Differently from cylinders' edges, the cones' ones are drawed through Line, now LineSegments, so before putting them in the code we need to remove the repeated numbers. This saves RAM and increases the performance.
	// To get them: console.log(new EdgesGeometry(coneGeometry).attributes.position.array)

	const edgesGeometry = new InstancedBufferGeometry()
		.setAttribute(
			'position',
			new BufferAttribute(
				new Float32Array([
					0, -1, 0,
					0.258819043636322, -0.9659258127212524, 0,
					0.5, -0.8660253882408142, 0,
					0.7071067690849304, -0.7071067690849304, 0,
					0.8660253882408142, -0.5, 0,
					0.9659258127212524, -0.258819043636322, 0,
					1, 0, 0,
					0.9659258127212524, 0.258819043636322, 0,
					0.8660253882408142, 0.5, 0,
					0.7071067690849304, 0.7071067690849304, 0,
					0.5, 0.8660253882408142, 0,
					0.258819043636322, 0.9659258127212524, 0,
					0, 1, 0,
					-0.258819043636322, 0.9659258127212524, 0,
					-0.5, 0.8660253882408142, 0,
					-0.7071067690849304, 0.7071067690849304, 0,
					-0.8660253882408142, 0.5, 0,
					-0.9659258127212524, 0.258819043636322, 0,
					-1, 0, 0,
					-0.9659258127212524, -0.258819043636322, 0,
					-0.8660253882408142, -0.5, 0,
					-0.7071067690849304, -0.7071067690849304, 0,
					-0.5, -0.8660253882408142, 0,
					-0.258819043636322, -0.9659258127212524, 0,
					0, -1, 0
				]),
				3
			)
		)
		// If we don't scale x and y the edge is smaller than the cone, scaling z changes the position of the edges.
		.scale(radius, radius, 1);

	edgesGeometry.instanceCount = coords.length / 2;

	edgesGeometry.setAttribute(
		'coneBase',
		new InstancedBufferAttribute(coneBases, 3)
	);

	edgesGeometry.setAttribute(
		'coneTip',
		new InstancedBufferAttribute(coneTips, 3)
	);

	const edges = new Line(
		edgesGeometry,
		new ShaderMaterial({
			uniforms: {
				color: { value: edgeForm.color ?? [0, 0, 0] }
			},
			vertexShader: `
				attribute vec3 coneBase;
				attribute vec3 coneTip;

				void main() {
					vec3 z = normalize(coneBase - coneTip);
					// If z.z is 0 the edges doesn't appear.
					z.z += 0.0001;

					vec3 x = normalize(cross(vec3(0, 1, 0), z));
					vec3 y = cross(z, x);

					// position and rotate the edges
					mat4 coneMatrix = mat4(
						x, 0,       // row 0
						y, 0,       // row 1
						z, 0,       // row 2
						coneBase, 1 // row 3
					);

					gl_Position = projectionMatrix * modelViewMatrix * coneMatrix * vec4(position, 1);
				}
			`,
			fragmentShader: `
				uniform vec3 color;

				void main() {
					gl_FragColor = vec4(color, 1);
				}
			`
		})
	);

	edges.frustumCulled = false;

	group.add(edges);

	return group;
}
