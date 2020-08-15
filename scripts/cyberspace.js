// A script for rendering cyberspace as code flying though 3D space with WebGL

// Define globals
let gl = null;
let glCanvas = null;
let shaderProgram;

window.addEventListener("load", main, false);




function makeTextCanvas(text) {
	// Process text
	var fontSize = 20;
	text = text.split("\n");
	var height = fontSize * (text.length+3);
	var width = fontSize * 0.65 * Math.max(...text.map( line => line.length));

	var textCanvas = document.createElement("canvas").getContext("2d");
	textCanvas.canvas.width  = width;
	textCanvas.canvas.height = height;
	textCanvas.font = "20px monospace";
	textCanvas.fillStyle = "green";

	for (var i_line=0; i_line < text.length; i_line++){
		textCanvas.fillText(text[i_line], fontSize, fontSize*(i_line+2));
	}
	return textCanvas.canvas;
}


// The programs
let vertexShader = `
	const mat4 perspective_transform = mat4(
		1,0,0,0,
		0,-1,0,0,
		0,0,1,0,
		0,0,1,0
	);

	uniform float scroll_factor;

	uniform float azimuthal_angle;
	uniform float polar_angle;
	uniform vec3 translation;


	attribute vec2 initial_position;
	attribute vec2 a_texCoord;

	uniform vec3 clipspace_scale;

	varying vec2 v_texCoord;

	void main() {
		// First transform the position in viewspace
		vec3 viewspace_position = vec3(initial_position, 0);
		
		// Scroll factor
		viewspace_position.y += scroll_factor;
		// Azimuthal rotation
		float rad_azimuthal_angle = radians(azimuthal_angle);
		mat3 azimuthal_rotation = mat3(
			1, 0, 0,
			0, cos(rad_azimuthal_angle), -sin(rad_azimuthal_angle),
			0, sin(rad_azimuthal_angle), cos(rad_azimuthal_angle)
			);
		viewspace_position = viewspace_position * azimuthal_rotation;
		// Polar rotation
		float rad_polar_angle = radians(polar_angle);
		mat3 polar_rotation = mat3(
			cos(rad_polar_angle), 0, -sin(rad_polar_angle),
			0, 1, 0,
			sin(rad_polar_angle), 0, cos(rad_polar_angle)
			);
		viewspace_position = viewspace_position * polar_rotation;
		// Translation
		viewspace_position += translation;


		// Then set the clipspace position
		vec4 clipspace_position = vec4(2.0 * viewspace_position / clipspace_scale, 1);
		gl_Position = clipspace_position * perspective_transform;

		// pass the texCoord to the fragment shader
		// The GPU will interpolate this value between points.
		v_texCoord = a_texCoord;
	}
`;
let fragmentShader = `
	precision mediump float;

	// our texture
	uniform sampler2D u_image;
	// the texCoords passed in from the vertex shader.
	varying vec2 v_texCoord;


	void main() {
		gl_FragColor = texture2D(u_image, v_texCoord);
	}
`;


function main() {
	// Before the WebGL part let's make the texture
	var image = makeTextCanvas(vertexShader+fragmentShader)

	// Initial setup
	glCanvas = document.getElementById("glcanvas");
	gl = glCanvas.getContext("webgl");
	// Set the view port
	gl.viewport(0,0, glCanvas.width, glCanvas.height);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	//gl.depthMask(false);
	
	// Compile the program
	program =  buildShaderProgram(vertexShader, fragmentShader);
	gl.useProgram(program);
	
	
	
	// Setup data
	var n_dim = 2;
	var n_tris = 2;
	
	// Uniform indicies
	var clipspace_scaleLocation = gl.getUniformLocation(program, "clipspace_scale");
	var scroll_factorLocation = gl.getUniformLocation(program, "scroll_factor");
	var azimuthal_angleLocation = gl.getUniformLocation(program, "azimuthal_angle");
	var polar_angleLocation = gl.getUniformLocation(program, "polar_angle");
	var translationLocation = gl.getUniformLocation(program, "translation");
	// Attributes indicies
	var positionLocation = gl.getAttribLocation(program, "initial_position");
	var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
	// Buffer allocation and indicies
	var positionBuffer = gl.createBuffer();
	var texcoordBuffer = gl.createBuffer();
	// Texture allocation and indicies
	var texture = gl.createTexture();
	
	
	// Create a buffer to put the untransformed points in
	var rectangleCoordinates = [
		-image.width/2, -image.height/2,
		image.width/2, -image.height/2,
		-image.width/2, image.height/2,
		-image.width/2, image.height/2,
		image.width/2, -image.height/2,
		image.width/2, image.height/2,
	];
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangleCoordinates), gl.STATIC_DRAW);

	// Provide matching texture coordinates for the rectangle.
	var textureCoordinates = [
		0,  0,
		1,  0,
		0,  1,
		0,  1,
		1,  0,
		1,  1,
	];
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);


	// Create a texture.
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);


	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Clear the canvas
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	// Turn on the position attribute
	gl.enableVertexAttribArray(positionLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(positionLocation, n_dim, gl.FLOAT, false, 0, 0);

	// Turn on the texcoord attribute
	gl.enableVertexAttribArray(texcoordLocation);
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.vertexAttribPointer(texcoordLocation, n_dim, gl.FLOAT, false, 0, 0);

	// Tell WebGL how to convert from clip space to pixels
	//gl.canvas.width  = window.innerWidth;
	//gl.canvas.height = window.innerHeight;
	// set the resolution
	gl.uniform3f(clipspace_scaleLocation, gl.canvas.width, gl.canvas.height, (gl.canvas.width+gl.canvas.height)/2);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	
	
	// Draw function
	function drawPlane(scroll_factor, azimuthal_angle, polar_angle, x_translation, y_translation, z_translation){
		// set the transform
		gl.uniform1f(scroll_factorLocation, scroll_factor);
		gl.uniform1f(azimuthal_angleLocation, azimuthal_angle);
		gl.uniform1f(polar_angleLocation, polar_angle);
		gl.uniform3f(translationLocation, x_translation, y_translation, z_translation);
		
		// Draw the rectangle.
		gl.drawArrays(gl.TRIANGLES, 0, 3*n_tris);
	}

	
	// Define animation parameters
	var n_planes = 40;
	var speed = 100;
	// Inits
	var planeStack = [];
	for (var i_plane = 0; i_plane < n_planes; i_plane++) planeStack.push(
		{
			birthday: 0,
			azimuthal_angle: 90 * Math.floor(3 * Math.random()) - 90,
			polar_angle: 90 * Math.floor(3 * Math.random()) - 90,
			x_translation: 1000 * Math.random() - 500,
			y_translation: 1000 * Math.random() - 500,
			z_translation: 2000 * Math.random()
		});


	// Setup animation
	var then = 0;
	var loopLength = 10;
	function drawFrame(time) {
		// Setup time delta
		time *= 0.001;
		var dt = time - then;
		then = time;
		var loopFraction = (time % loopLength)/parseFloat(loopLength);
		
		// Perform rendering
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		for (var i_plane of planeStack) {
			// Move the plane closer
			i_plane.z_translation -= speed*dt;
			i_plane.z_translation = (2000+i_plane.z_translation) % 2000;
			
			drawPlane(
				0,//-0.5*(i_plane.z_translation - 1000),
				i_plane.azimuthal_angle,
				i_plane.polar_angle,
				i_plane.x_translation,
				i_plane.y_translation,
				i_plane.z_translation
				);
		}
		requestAnimationFrame(drawFrame);
	}
	requestAnimationFrame(drawFrame);
}




// Shader building tools from Mozilla
function buildShaderProgram(vertexSource, fragmentSource) {
	let program = gl.createProgram();
	
	// Compile the vertex shader
	let vShader = compileShader(vertexSource, gl.VERTEX_SHADER);
	if (vShader) gl.attachShader(program, vShader);
	// Compile the fragment shader
	let fShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
	if (fShader) gl.attachShader(program, fShader);

	gl.linkProgram(program)

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log("Error linking shader program:");
		console.log(gl.getProgramInfoLog(program));
	}

	return program;
}

function compileShader(source, type) {
	let shader = gl.createShader(type);

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
		console.log(gl.getShaderInfoLog(shader));
	}
	return shader;
}



