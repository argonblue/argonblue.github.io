---
title: Interactive WebGL Trochoid Demo
katex: true
threejs: true
---

Interactive [WebGL](https://en.wikipedia.org/wiki/WebGL) demo of [hypotrochoids](https://en.wikipedia.org/wiki/Hypotrochoid).
Uses [three.js](https://threejs.org/).
Sources [on GitHub](https://github.com/argonblue/argonblue.github.io/blob/main/assets/troch-webgl.js).
Equation, as [complex exponentials](https://en.wikipedia.org/wiki/Euler%27s_formula):

$$
z = r \exp(i \theta) + (1-r) \exp\left({b-a\over b} i \theta\right)
$$

<style>
    .lil-gui { --name-width: 25%; }
    .lil-gui.root { position: absolute; top: 0px; right: 0px; }
    div.gl-container { position: relative; top: 0px; left: 0px; width: 100%; z-index: 9000; }
    canvas.gl-container { display: block; width: 100%; }
    @media (min-height: 500px) {
      canvas.gl-container { min-height: 400px; }
    }
    @media (min-width: 600px) {
      .lil-gui.root { --width: 200px; }
    }
</style>
<div class="gl-container">
    <canvas class="gl-container" style="display: block"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/mathjs@10.5.0/lib/browser/math.js"></script>
<script type="module" src="/assets/troch-webgl.js"></script>

## Details

$a$ and $b$ set the "gearing" of the circles (their rotation speeds).
The "breathing" is cosine-squared modulation of $r$ (relative radii of the circles).
The "spin" (not shown in the equation) tweaks the rotation speeds to be slightly off from the gearing.

Try changing the curve parameters.
You might notice that the curve complexity jumps around a bit when $a$ and $b$ have a common factor.
(Their ratio is what's important, not their actual values.)
