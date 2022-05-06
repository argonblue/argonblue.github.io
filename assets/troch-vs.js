import * as THREE from 'three';
import Stats from "https://unpkg.com/three@0.139/examples/jsm/libs/stats.module.js";
import { EffectComposer } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/AfterimagePass.js';
import { GUI } from 'https://unpkg.com/three@0.139/examples/jsm/libs/lil-gui.module.min.js';

const container = document.querySelector("div.gl-container");
const canvas = document.querySelector("canvas.gl-container");
let renderer;
let stats;
let camera;
let scene;
let composer;
let afterimagePass;

let geometry;
const maxsamp = 10000;

const params = {
    _devicePixels: false,
    get devicePixels() { return this._devicePixels; },
    set devicePixels(val) {
        if (this._devicePixels == val) { return; }
        this._devicePixels = val;
        resizeToDisplaySize();
    }
};

let line;
let mesh;
let material;

const vs = `
#define CS(x) (vec2(cos(x), sin(x)))

uniform float fr, rph;
uniform float a, b, bph;
uniform float linewidth;
uniform bool stepwise;
attribute vec3 seg;

// Actual trochoid curve point calculation
vec2 curvepoint(float th) {
    float fr_ = fr, b_ = b;
    if (stepwise) {
        // Avoid gaps by rounding to int
        fr_ = floor(fr);
        b_ = floor(b);
    }
    float r = cos(fr_*th+rph);
    r = 1. - r*r;
    return mix(CS(a*th), CS(b_*th+bph), r);
}

/*
 * Encoding:
 *
 * position.x multiplies n1
 * position.y determines base point: p0 vs p1
 * abs(position.z) picks n1 or n2 for the bevel
 * sign(position.z) picks direction in bevel
 *
 * sign(cross(n2, n1)) determines which side bevel goes on.
 */
vec2 rect_tri(vec2 p[3]) {
    mat2 rot90 = mat2(0, 1, -1, 0);
    vec2 d1 = normalize(p[1]-p[0]);
    vec2 n1 = rot90*d1;
    vec2 d2 = normalize(p[2]-p[1]);
    vec2 n2 = rot90*d2;
    float s = sign(cross(vec3(n2, 0), vec3(n1, 0)).z);

    bvec2 psel = equal(vec2(0, 1), position.yy);
    bvec2 nsel = equal(vec2(1, 2), abs(position.zz));
    if (s < 0.) {
        // Swap normals to keep front-facing
        nsel = not(nsel);
    }
    vec2 nv = vec2(position.x, 0) + s*vec2(nsel)*sign(position.z);
    mat4 m = mat4(
        vec4(p[0], 0, 0),
        vec4(p[1], 0, 0),
        vec4(n1 * .5*linewidth, 0, 0),
        vec4(n2 * .5*linewidth, 0, 0)
    );
    return (m * vec4(psel, nv)).xy;
}

void main() {
    vec2 p[3];
    p[0] = curvepoint(seg.x);
    p[1] = curvepoint(seg.y);
    p[2] = curvepoint(seg.z);
    vec2 v = rect_tri(p);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(v, 0, 1);
}
`;

const fs = `
void main() {
    gl_FragColor = vec4(.1, .8, 1, 1);
}`;

function camera_aspect(width, height) {
    const aspect = width / height;
    let halfwidth = 1.1, halfheight = 1.1;
    if (aspect >= 1.0) {
        halfwidth *= aspect;
    } else {
        halfheight /= aspect;
    }
    return [halfwidth, halfheight];
}

function init_render() {
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    stats = new Stats();
    container.appendChild(stats.dom);
    stats.dom.style.position = 'absolute'; // hack because it has no id or class name

    // const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    const [halfwidth, halfheight] = camera_aspect(
        canvas.clientWidth, canvas.clientHeight);
    camera = new THREE.OrthographicCamera(
        -halfwidth, halfwidth, -halfheight, halfheight, 0.1, 100);
    camera.position.z = 2;

    scene = new THREE.Scene();

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    afterimagePass = new AfterimagePass(0.8);
    composer.addPass(afterimagePass);
}

function set_segs(geometry, nsamp) {
    const verts = new Float32Array(nsamp * 3);
    for (let i = 0; i < nsamp; i++) {
        const t0 = i/(nsamp-1);
        const t1 = (i+1)/(nsamp-1);
        const t2 = (i+2)/(nsamp-1);
        verts[3 * i] = 2*Math.PI*t0;
        verts[3 * i + 1] = 2*Math.PI*t1;
        verts[3 * i + 2] = 2*Math.PI*t2;
    }
    geometry.attributes.seg.set(verts);
    geometry.attributes.seg.needsUpdate = true;
    geometry.instanceCount = nsamp;
}

/*
 * Instanced geometry, where each instance is a line segment,
 * along with the bevel triangle for the joint.
 *
 * The actual instance data is the angle for drawing the trochoid.
 */
function init_geometry() {
    geometry = new THREE.InstancedBufferGeometry();
    const qverts = [
        -1, 0, 0,
        1, 0, 0,
        1, 1, 0,
        -1, 1, 0,
        0, 1, 2,
        0, 1, 1,
        0, 1, -2
    ];
    const indices = [
        0, 2, 1, 0, 3, 2, 4, 5, 6
    ];
    geometry.setAttribute('position',
        new THREE.Float32BufferAttribute(qverts, 3));
    geometry.setAttribute('seg', new THREE.InstancedBufferAttribute(
        new Float32Array(3 * maxsamp), 3, false, 1));
    set_segs(geometry, maxsamp);
    geometry.setIndex(indices);
    const uniforms = {
        fr: { value: 0.0 },
        rph: { value: 0.0 },
        a: { value: 0.0 },
        b: { value: 0.0 },
        bph: { value: 0.0 },
        linewidth: { value: 0.01 },
        stepwise: { value: true }
    };
    material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vs, fragmentShader: fs
    });
    line = new THREE.Line(geometry, material);
    line.visible = false;
    mesh = new THREE.Mesh(geometry, material);
    scene.add(line);
    scene.add(mesh);
}

function resizeToDisplaySize() {
    let width = container.clientWidth;
    let height = container.clientHeight;
    width = Math.min(width, window.innerWidth);
    height = Math.min(height, window.innerHeight);
    if (params.devicePixels) {
        const _pixelRatio = window.devicePixelRatio;
        width *= _pixelRatio;
        height *= _pixelRatio;
    }
    const size = renderer.getSize(new THREE.Vector2);
    if (width == size.x && height == size.y) {
        return;
    }
    const [halfwidth, halfheight] = camera_aspect(width, height);
    camera.left = -halfwidth;
    camera.right= halfwidth;
    camera.bottom = -halfheight;
    camera.top = halfheight;
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.updateProjectionMatrix();
    console.log(width, height, size);
}

function toggleFillWindow() {
    if (container.style.position != 'fixed') {
        container.style.position = 'fixed';
        container.style.height = '100%';
    } else {
        container.style.position = 'relative';
        container.style.height = null;
    }
}

class Osc {
    constructor(f=1.0, ph=0.0) {
        this.f = f;
        this.ph = ph;
    }
    update() {
        // Use fractional part to update phase, to avoid loss of precision
        // at higher rotation frequencies
        let ffrac = this.f % 1.0;
         if (ffrac < 0) {
             ffrac += 1.0;
        }
        this.ph += 2 * Math.PI * ffrac;
        this.ph %= 2 * Math.PI;
    }
    x(val) {
        return Math.cos(2 * Math.PI * this.f * val + this.ph);
    }
    y(val) {
        return Math.sin(2 * Math.PI * this.f * val + this.ph);
    }
    v(val) {
        const th = 2 * Math.PI * this.f * val + this.ph;
        return [Math.cos(th), Math.sin(th)];
    }
}

class Troch {
    constructor(a=-3, b=1, bend=0.01, fr=0.001) {
        this._a = a;
        this._b = b;
        this._bend = bend;
        this._nsamp = maxsamp;

        this.osc_a = new Osc();
        this.osc_b = new Osc();
        this.osc_r = new Osc(fr);
        this.setf();
    }
    setf() {
        // Recalculate oscillator frequencies
        const k = math.fraction(this._a, this._b);
        this.osc_a.f = k.d;
        // Adjust bend to keep constant rotation with k.d changes
        this.osc_b.f = k.d - k.s*k.n + this._bend/k.d;
    }
    v(val) {
        const [xa, ya] = this.osc_a.v(val);
        const [xb, yb] = this.osc_b.v(val);
        const r = 1 - this.osc_r.x(val) ** 2;
        return [r * xa + (1-r) * xb, r * ya + (1-r) * yb];
    }
    update() {
        material.uniforms.a.value = this.osc_a.f;
        material.uniforms.b.value = this.osc_b.f;
        material.uniforms.bph.value = this.osc_b.ph;
        material.uniforms.fr.value = this.osc_r.f;
        material.uniforms.rph.value = this.osc_r.ph;
        material.uniformsNeedUpdate = true;
        this.osc_r.update();
        this.osc_b.update();
    }
    get a() { return this._a; }
    set a(val) {
        this._a = val;
        this.setf();
    }
    get b() { return this._b; }
    set b(val) {
        this._b = val;
        this.setf();
    }
    get bend() { return this._bend; }
    set bend(val) {
        this._bend = val;
        this.setf();
    }
    get fa() { return this.osc_a.f; }
    set fa(_) {}
    get fb() { return this.osc_b.f; }
    set fb(_) {}
    get wireframe() { return line.visible; }
    set wireframe(val) {
        line.visible = val;
        mesh.visible = !val;
        line.needsUpdate = true;
        mesh.needsUpdate = true;
    }
    get nsamp() { return this._nsamp; }
    set nsamp(val) {
        if (this._nsamp == val) { return; }
        this._nsamp = val;
        set_segs(geometry, val);
    }
}

function init_gui() {
    const gui = new GUI({container});
    const agui = gui.addFolder('Animation');
    const cgui = gui.addFolder('Curve');
    const rendergui = gui.addFolder('Rendering');

    agui.add(troch, 'bend', 0, 0.1, 0.001).name('spin');
    agui.add(troch.osc_b, 'ph', 0, 2*Math.PI, 0.001)
        .name('spin ph.').listen();
    agui.add(troch.osc_r, 'f', -0.01, 0.01, 0.001).name('breathe');
    agui.add(troch.osc_r, 'ph', 0, 2*Math.PI, 0.0001)
        .name('breathe ph.').listen();

    cgui.add(troch, 'a', -13, 13, 1);
    cgui.add(troch, 'b', 1, 11, 1);
    cgui.add(troch, 'fa').listen();
    cgui.add(troch, 'fb').listen();

    rendergui.add(afterimagePass.uniforms['damp'], 'value', 0, 1, 0.01)
        .name('trails');
    rendergui.add(material.uniforms.linewidth, 'value', 0.005, 0.2, 0.001)
        .name('linewidth');
    rendergui.add(troch, 'nsamp', 30, maxsamp, 10);
    rendergui.add(material.uniforms.stepwise, 'value').name('stepwise');
    rendergui.add(troch, 'wireframe');
    rendergui.add(params, 'devicePixels');

    gui.add(gui, 'reset');
    gui.add({'toggle expand': toggleFillWindow}, 'toggle expand');

    cgui.close();
    rendergui.close();
}

function animate() {
    resizeToDisplaySize();
    troch.update();
    composer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
}

const troch = new Troch();
init_render();
init_geometry();
init_gui();
requestAnimationFrame(animate);
