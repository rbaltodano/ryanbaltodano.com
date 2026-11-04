import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// One persistent scene per print, on the page and while inspecting it. Both
// faces and the cut edge share a bend; the photo's gloss coat only shows
// once the open print is turned in 3D.
export async function createInspector(photo, image, host, reduce) {
  await image.decode();
  await document.fonts.ready;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const canvas = renderer.domElement;
  canvas.className = 'lightbox__scene';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.65;
  room.dispose();
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xfff3de, 1.8);
  key.position.set(-5, 7, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8e5ff, 1.6);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const w = photo.offsetWidth, h = photo.offsetHeight;
  const textureWidth = innerWidth < 600 ? 1024 : 1536, factor = textureWidth / w;
  function sheet() {
    const c = document.createElement('canvas');
    c.width = textureWidth;
    c.height = Math.round(h * factor);
    return c;
  }
  const front = sheet(), ctx = front.getContext('2d');
  ctx.scale(factor, factor);
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, w, h);
  const ix = image.offsetLeft, iy = image.offsetTop;
  const iw = image.offsetWidth, ih = image.offsetHeight;
  const crop = Math.max(iw / image.naturalWidth, ih / image.naturalHeight);
  const sw = iw / crop, sh = ih / crop;
  ctx.filter = getComputedStyle(image).filter;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2,
    sw, sh, ix, iy, iw, ih);
  ctx.filter = 'none';
  const caption = photo.querySelector('figcaption');
  if (caption) {
    const style = getComputedStyle(caption);
    ctx.font = style.font;
    ctx.fillStyle = '#51473b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(caption.textContent.trim(), w / 2, caption.offsetTop + caption.offsetHeight / 2 + 2);
  }
  // Fine paper grain, shared by the color and roughness treatment.
  let seed = 17;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 22000; i++) {
    ctx.fillStyle = `rgba(69, 55, 35, ${random() * 0.045})`;
    ctx.fillRect(random() * w, random() * h, 0.3, 0.3);
  }
  ctx.strokeStyle = 'rgba(126, 108, 77, 0.18)';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(0.3, 0.3, w - 0.6, h - 0.6);
  const gloss = sheet(), gc = gloss.getContext('2d');
  gc.scale(factor, factor);
  gc.fillStyle = '#000'; gc.fillRect(0, 0, w, h);
  gc.fillStyle = '#fff'; gc.fillRect(ix, iy, iw, ih);
  const rough = sheet(), rc = rough.getContext('2d');
  rc.scale(factor, factor);
  rc.fillStyle = '#ededed'; rc.fillRect(0, 0, w, h);
  rc.fillStyle = '#707070'; rc.fillRect(ix, iy, iw, ih);
  const rear = sheet(), bc = rear.getContext('2d');
  bc.scale(factor, factor);
  bc.fillStyle = '#e4dfd2'; bc.fillRect(0, 0, w, h);
  bc.fillStyle = '#34352f'; bc.fillRect(ix, iy, iw, ih);
  for (let i = 0; i < 18000; i++) {
    bc.fillStyle = `rgba(20, 20, 14, ${random() * 0.055})`;
    bc.fillRect(random() * w, random() * h, 0.4, 0.4);
  }
  bc.fillStyle = '#948e7f';
  bc.font = `${Math.max(7, w * 0.025)}px monospace`;
  bc.textAlign = 'center';
  bc.fillText('INSTANT FILM  /  KEEP THIS MOMENT', w / 2, h - Math.max(12, (h - iy - ih) / 2));
  const textures = [];
  function texture(source, color = false) {
    const t = new THREE.CanvasTexture(source);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    textures.push(t);
    return t;
  }
  const frontMaterial = new THREE.MeshPhysicalMaterial({
    map: texture(front, true), roughnessMap: texture(rough), roughness: 0.8,
    clearcoat: 0.001, clearcoatMap: texture(gloss), clearcoatRoughness: 0.24,
    metalness: 0, ior: 1.46, envMapIntensity: 0.35
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    map: texture(rear, true), roughness: 0.95, side: THREE.BackSide
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#cfc7b4', roughness: 0.95, side: THREE.DoubleSide });
  const mw = 2.7, mh = mw * h / w, thickness = 0.012;
  const bend = (x, y) => 0.22 * (x / mw) ** 2 - 0.13 * (y / mh) ** 2
    + 0.045 * Math.sin(y / mh * Math.PI * 2) + 0.06 * x * y / (mw * mh);
  function face(depth) {
    const geometry = new THREE.PlaneGeometry(mw, mh, 48, 64);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, bend(positions.getX(i), positions.getY(i)) + depth);
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  const frontGeometry = face(thickness / 2), backGeometry = face(-thickness / 2);
  const backUV = backGeometry.attributes.uv;
  for (let i = 0; i < backUV.count; i++) backUV.setX(i, 1 - backUV.getX(i));
  const group = new THREE.Group();
  group.add(new THREE.Mesh(frontGeometry, frontMaterial), new THREE.Mesh(backGeometry, backMaterial));
  // A closed ribbon joins the front and back, including the bend at every edge.
  const perimeter = [];
  const steps = 64;
  for (let i = 0; i < steps; i++) perimeter.push([-mw / 2 + mw * i / steps, mh / 2]);
  for (let i = 0; i < steps; i++) perimeter.push([mw / 2, mh / 2 - mh * i / steps]);
  for (let i = 0; i < steps; i++) perimeter.push([mw / 2 - mw * i / steps, -mh / 2]);
  for (let i = 0; i < steps; i++) perimeter.push([-mw / 2, -mh / 2 + mh * i / steps]);
  const vertices = [];
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i], b = perimeter[(i + 1) % perimeter.length];
    const point = (p, depth) => [p[0], p[1], bend(...p) + depth];
    vertices.push(...point(a, thickness / 2), ...point(a, -thickness / 2), ...point(b, thickness / 2),
      ...point(b, thickness / 2), ...point(a, -thickness / 2), ...point(b, -thickness / 2));
  }
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  edgeGeometry.computeVertexNormals();
  group.add(new THREE.Mesh(edgeGeometry, edgeMaterial));
  scene.add(group);
  let targetX = -0.09, targetY = -0.16, frame = 0, disposed = false, shine = 0, turned = false;
  let baseDistance = 10, side = 1, view = null;
  const corner = new THREE.Vector3();
  group.rotation.set(targetX, targetY, -0.025, 'YXZ');
  function draw() {
    frame = 0;
    if (disposed) return;
    const smoothing = reduce ? 1 : 0.2;
    group.rotation.x += (targetX - group.rotation.x) * smoothing;
    group.rotation.y += (targetY - group.rotation.y) * smoothing;
    let distance = baseDistance;
    if (view) {
      group.updateMatrixWorld(true);
      const f = 1 / Math.tan(THREE.MathUtils.degToRad(17));
      const limitX = Math.min(1, view.width / side) * 0.94;
      const limitY = Math.min(1, view.height / side) * 0.94;
      // Dolly back only as a turned corner needs more room. This lets the front
      // open at a useful size on phones while every orientation fits the controls.
      for (const x of [-mw / 2, mw / 2]) for (const y of [-mh / 2, mh / 2]) for (const z of [-0.15, 0.15]) {
        corner.set(x, y, z).applyMatrix4(group.matrixWorld);
        distance = Math.max(distance, corner.z + Math.abs(corner.x) * f / limitX,
          corner.z + Math.abs(corner.y) * f / limitY);
      }
    }
    camera.position.z += (distance - camera.position.z) * (distance > camera.position.z ? 1 : smoothing);
    const gloss = view && turned ? 0.75 : 0;
    shine += (gloss - shine) * (reduce ? 1 : 0.12);
    if (Math.abs(gloss - shine) < 0.001) shine = gloss;
    frontMaterial.clearcoat = Math.max(0.001, shine);
    renderer.render(scene, camera);
    if (Math.abs(targetX - group.rotation.x) + Math.abs(targetY - group.rotation.y) + Math.abs(distance - camera.position.z) + Math.abs(gloss - shine) > 0.0001) frame = requestAnimationFrame(draw);
  }
  function requestDraw() { if (!frame && !disposed) frame = requestAnimationFrame(draw); }
  function resize() {
    const width = photo.offsetWidth, height = photo.offsetHeight;
    if (!width || !height) return;
    // Transparent room around the mesh holds its entire turning radius. The
    // canvas stays in the figure and scales with it, including during the flight.
    side = Math.ceil(Math.hypot(width, height) * 1.5);
    canvas.style.width = side + 'px';
    canvas.style.height = side + 'px';
    renderer.setSize(side, side, false);
    camera.aspect = 1;
    group.scale.y = (height / width) / (h / w);
    baseDistance = mw * side / (width * 2 * Math.tan(THREE.MathUtils.degToRad(17)));
    camera.position.z = baseDistance;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(photo);
  resize();
  // Compile before replacing the DOM print, avoiding a blank first frame.
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  return {
    canvas,
    setViewport(width, height) {
      view = width && height ? { width, height } : null;
      requestDraw();
    },
    setRotation(x, y) {
      turned = x !== 0 || y !== 0;
      targetX = THREE.MathUtils.degToRad(x) - 0.09;
      targetY = THREE.MathUtils.degToRad(y) - 0.16;
      requestDraw();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      [frontGeometry, backGeometry, edgeGeometry, frontMaterial, backMaterial, edgeMaterial, ...textures, environment].forEach(item => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    }
  };
}
