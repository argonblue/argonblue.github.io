import * as THREE from 'three';
import Stats from "https://unpkg.com/three@0.139/examples/jsm/libs/stats.module.js";
import { EffectComposer } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://unpkg.com/three@0.139/examples/jsm/postprocessing/AfterimagePass.js';
import { GUI } from 'https://unpkg.com/three@0.139/examples/jsm/libs/lil-gui.module.min.js';
import { Line2 } from 'https://unpkg.com/three@0.139/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'https://unpkg.com/three@0.139/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'https://unpkg.com/three@0.139/examples/jsm/lines/LineMaterial.js';

const container = document.querySelector("div.gl-container");
const canvas = document.querySelector("canvas.gl-container");
let renderer;
let stats;
let camera;
let scene;
let composer;
let afterimagePass;

const nsamp = 1001;
const verts = new Float32Array(nsamp * 3);

let line;
let material;

function init_render() {
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setPixelRatio(window.devicePixelRatio);

    stats = new Stats();
    container.appendChild(stats.dom);
    stats.dom.style.position = 'absolute'; // hack because it has no id or class name

    const aspect = canvas.clientWidth/canvas.clientHeight;
    // const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    let halfwidth, halfheight;
    if (aspect >= 1.0) {
        halfwidth = 1.1 * aspect;
        halfheight = 1.1;
    } else {
        halfwidth = 1.1;
        halfheight = 1.1 / aspect;
    }
    camera = new THREE.OrthographicCamera(
        -halfwidth, halfwidth, -halfheight, halfheight, 0.1, 100);
    camera.position.z = 2;

    scene = new THREE.Scene();

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    afterimagePass = new AfterimagePass(0.8);
    composer.addPass(afterimagePass);
}

function init_geometry() {
    // const geometry = new THREE.BufferGeometry();
    // geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    // const material = new THREE.LineBasicMaterial({color: 0x3fcfff, linewidth: 2});
    // const line = new THREE.Line(geometry, material);
    const geometry = new LineGeometry();
    geometry.setPositions(verts);
    // worldUnits: true seems not to work with OrthographicCamera
    material = new LineMaterial({
        color: 0x3fcfff, linewidth: 0.005, worldUnits: false,
        vertexColors: true, dashed: false, alphaToCoverage: true
    });
    const colors = [];
    const color = new THREE.Color(0x3fcfff);
    for (let i = 0; i < nsamp; i++) {
        colors.push(color.r, color.g, color.b);
    }
    geometry.setColors(colors);
    line = new Line2(geometry, material);
    scene.add(line);
}

function resizeToDisplaySize() {
    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width > window.innerWidth) {
        width = window.innerWidth;
    }
    if (height > window.innerHeight) {
        height = window.innerHeight;
    }
    let size = new THREE.Vector2;
    renderer.getSize(size);
    if (width != size.x
        || height != size.y) {
            const aspect = width/height;
            let halfwidth, halfheight;
            if (aspect >= 1.0) {
                halfwidth = 1.1 * aspect;
                halfheight = 1.1;
            } else {
                halfwidth = 1.1;
                halfheight = 1.1 / aspect;
            }
            camera.left = -halfwidth;
            camera.right= halfwidth;
            camera.bottom = -halfheight;
            camera.top = halfheight;
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
            camera.updateProjectionMatrix();
            console.log(width, height, size);
        }
}

function toggleFillWindow() {
    if (container.style.position != 'fixed') {
        container.style.position = 'fixed';
        container.style.height = '100%';
    } else {
        container.style.position = 'relative';
        delete container.style.height;
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
        this.osc_a.update();
        this.osc_b.update();
        this.osc_r.update();
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
    get fb() { return this.osc_b.f; }
}

function init_gui() {
    const gui = new GUI({container});
    const agui = gui.addFolder('Animation');
    agui.add(troch, 'bend', 0, 0.1, 0.001).name('spin');
    agui.add(troch.osc_b, 'ph', 0, 2*Math.PI, 0.001)
        .name('spin ph.').listen();
    agui.add(troch.osc_r, 'f', -0.01, 0.01, 0.001).name('breathe');
    agui.add(troch.osc_r, 'ph', 0, 2*Math.PI, 0.0001)
        .name('breathe ph.').listen();

    const cgui = gui.addFolder('Curve');
    cgui.add(troch, 'a', -13, 13, 1);
    cgui.add(troch, 'b', 1, 11, 1);
    cgui.add(troch, 'fa').listen();
    cgui.add(troch, 'fb').listen();
    cgui.close();

    const rendergui = gui.addFolder('Rendering');
    rendergui.add(afterimagePass.uniforms['damp'], 'value', 0, 1, 0.01)
        .name('trails');
    rendergui.add(material, 'linewidth', 0.001, 0.02, 0.001);
    rendergui.close();
    gui.add(gui, 'reset');
    gui.add({'toggle expand': toggleFillWindow}, 'toggle expand');
}

function animate() {
    resizeToDisplaySize();
    for (let i = 0; i < nsamp; i++) {
        const t = i/(nsamp - 1);
        const [x, y] = troch.v(t);
        verts[3*i] = x;
        verts[3*i+1] = y;
        verts[3*i+2] = 0.0;
    }
    troch.update();
    line.geometry.setPositions(verts);
    // line.geometry.attributes.position.needsUpdate = true;
    composer.render(scene, camera);
    stats.update();
    requestAnimationFrame(animate);
}

const troch = new Troch();
init_render();
init_geometry();
init_gui();
requestAnimationFrame(animate);
