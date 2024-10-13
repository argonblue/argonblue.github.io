---
title: Test Vertex Shader
threejs: true
---
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
