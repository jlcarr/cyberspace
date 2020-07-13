# cyberspace
A WebGL project to depict cyberspace as a rendering of source code on flying planes in 3D.

## Features
- WebGL GPU accelerated rendering
- Simplified plane transformations in terms of polar rotations, azimuthal rotations, and translations
- HTML5 canvas used to render the text textures
- The program's own GLSL source code is rendered

## Implementation
At a high level the program essentially works like this:  
1. Draw the shader source code on a 2d HTML5 canvas
2. Convert the image to a WebGL texture
3. Define the basic plane and texture it with the source code image
4. Define the transformation of the plane
5. Draw the plane in 3D space
6. Repleat steps 4&5 for as many planes as desired

Planes are generated randomly, and their parameters are stored as JS objects so as to just perform simple parameter updates during the animation steps

## Todo
- Add Gaussian blur to create the bloom glow effect
- Add UI controls to tweak the animation in browser (color, n planes, distance ranges, orthogonality)

## WebGL resources
### Complete Guides
https://webglfundamentals.org  
http://learnwebgl.brown37.net  
https://xem.github.io/articles/webgl-guide.html  
### Introductory Examples
https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Basic_2D_animation_example  
https://www.tutorialspoint.com/webgl/webgl_drawing_points.htm  
### Mathematics Resources
https://en.wikipedia.org/wiki/Rotation_matrix  
https://en.wikipedia.org/wiki/Spherical_coordinate_system  
https://en.wikipedia.org/wiki/Affine_transformation  
https://en.wikipedia.org/wiki/Homogeneous_coordinates  
