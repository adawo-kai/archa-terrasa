"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
uniform float uTime;
uniform float uPixel;
uniform vec2 uWind;
attribute float aSeed;
varying float vAlpha;
varying float vHeat;
void main(){
  vec3 p = position;
  float speed = 0.035 + aSeed * 0.06;
  float life = fract(uTime * speed + aSeed * 13.0);
  p.y = -1.15 + life * 2.5;
  float sway = sin(uTime * (0.5 + aSeed) + aSeed * 40.0) * 0.05;
  p.x += sway + uWind.x * life * 0.35 + (aSeed - 0.5) * life * 0.25;
  p.y += uWind.y * life * 0.1;
  vHeat = 1.0 - life;
  vAlpha = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.55, 1.0, life)) * (0.55 + 0.45 * sin(uTime * 5.0 + aSeed * 70.0));
  gl_Position = vec4(p.xy, 0.0, 1.0);
  gl_PointSize = (1.4 + aSeed * aSeed * 4.2) * uPixel;
}`;

const frag = /* glsl */ `
varying float vAlpha;
varying float vHeat;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.0, d);
  float a = core * core * vAlpha;
  vec3 col = mix(vec3(0.95, 0.42, 0.16), vec3(1.0, 0.82, 0.55), vHeat * core);
  gl_FragColor = vec4(col * a, a);
}`;

/** Искры от огня арчи поверх фото: three.js, прозрачный холст, реагируют на курсор как ветер. */
export default function Embers({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const count = mobile ? 110 : 260;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // больше искр снизу-справа, где огонь на фото
      pos[i * 3] = Math.random() * 2.2 - 1.1;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const uniforms = { uTime: { value: 0 }, uPixel: { value: dpr }, uWind: { value: new THREE.Vector2() } };
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(g, mat));

    const resize = () => renderer.setSize(el.clientWidth, el.clientHeight, false);
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const wind = new THREE.Vector2();
    const last = { x: 0, y: 0, t: 0 };
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(16, now - last.t);
      wind.x = THREE.MathUtils.clamp(wind.x + ((e.clientX - last.x) / dt) * 0.05, -1, 1);
      wind.y = THREE.MathUtils.clamp(wind.y - ((e.clientY - last.y) / dt) * 0.03, -1, 1);
      last.x = e.clientX;
      last.y = e.clientY;
      last.t = now;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      wind.multiplyScalar(0.965);
      uniforms.uWind.value.lerp(wind, 0.08);
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      g.dispose();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />;
}
