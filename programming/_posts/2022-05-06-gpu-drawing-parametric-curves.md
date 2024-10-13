---
title: GPU drawing of parametric curves
threejs: true
---

At the heart of modern 3D rendering software is a *vertex shader*: a procedure on the GPU doing hardware-accelerated linear algebra to project the many vertices of polygons in the 3D scene onto a 2D viewing plane, and per-vertex lighting calculations, possibly millions of times per second.
…usually, that is.

Typically, the vertex shader inputs are polygon vertices from a painstakingly drawn or scanned 3D model.
However, there's an entire art form of programming vertex shaders to [procedurally generate art from nothing more than a vertex counter](https://webgl2fundamentals.org/webgl/lessons/webgl-drawing-without-data.html).
Sounds like a perfect way to draw some parametric curves using hardware acceleration!

I recently taught myself enough shader programming to draw some animated trochoids on the [vertexshaderart.com](https://www.vertexshaderart.com) site:

<iframe width="700" height="400" src="https://www.vertexshaderart.com/art/rXA7dW2QF9uYGive2" frameborder="0" allowfullscreen></iframe>

All the curve points are computed in real time on the GPU, in the vertex shader.

For some extremes along a different axis, [Shadertoy](https://shadertoy.com/) has a collection of procedurally-generated art that uses fragment (pixel) shaders instead of vertex shaders.

## GLSL

[OpenGL Shading Language](https://en.wikipedia.org/wiki/OpenGL_Shading_Language), the shading language used in OpenGL and WebGL, is a fascinating C-like language that is also remarkably unlike C in some ways.
There are no implicit arithmetic conversions for operators, for example.
Pointers don't exist.
In GLSL ES version 1.00 (used in the website above), array indices must be constants or loop variables (which themselves are quite restricted).

If I want to index an array using a variable, even if the variable is the output of a modulus operation, and it's therefore easily proven that it won't overflow the array, I still have to write a trivial loop to convince the compiler that it's okay.
I can appreciate the design tradeoffs that led to this kind of restriction.
These shader programs are compiled by the graphics driver, often interactively, so the amount of static program analysis they can do is limited.

On the other hand, many operators are overloaded to work on vectors and matrices in the obvious ways, which makes doing all the linear algebra of 3D drawing much easier.
Modern GPU hardware is massively parallel, so any shader computation that depends only on per-vertex state can be very fast.
I found myself making matrices in place of array lookups, and it probably wound up being faster anyway, due to hardware acceleration.

## Update: Interactive *vertex shader* trochoid visualization

This is an update to the [previous demo](/blog/math/2022/04/27/webgl-trochoids/), reworked to use a vertex shader to calculate the curve points in real time.
Source [here on GitHub](https://github.com/argonblue/argonblue.github.io/blob/main/assets/troch-vs.js).
Still using [three.js](https://threejs.org/), but also using [ShaderMaterial](https://threejs.org/docs/index.html#api/en/materials/ShaderMaterial) to compile a custom shader that calculates curve points.

<style>
    .lil-gui { --name-width: 25%; }
    .lil-gui.root { position: absolute; top: 0px; right: 0px; }
    div.gl-container {
      position: relative;
      top: 0px; left: 0px;
      width: 100%;
      z-index: 9000;
    }
    canvas.gl-container { display: block; width: 100%; height: 100%; }
    @media (min-height: 500px) {
      div.gl-container { min-height: 400px; }
    }
    @media (min-width: 600px) {
      .lil-gui.root { --width: 200px; }
    }
</style>
<div class="gl-container">
    <canvas class="gl-container" style="display: block"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/mathjs@10.5.0/lib/browser/math.js"></script>
<script type="module" src="/assets/troch-vs.js"></script>

Among other things, I relearned that drawing (thick) lines is hard, especially when they're animated curvy lines with loops and cusps, like you get with trochoids.
It's probably a story for another time.
For now, I'll just say that the joints between segments can be difficult to draw in a pleasing way, especially when there are many quickly turning segments that are shorter than they are wide.
You can try adjusting the rendering parameters in the above demo (especially linewidth) to see if you notice the issues.
