import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import Stats from "stats.js";

let container, controls;
let camera, scene, renderer;
let cube;
let fovOutAnim, zoomInAnim;
let fovInAnim, zoomOutAnim;
let zoomState = 0;
let isAnimating = false;
let treeMesh;
let finnMesh;

const ctaElem = document.getElementById("cta");

const stats = new Stats();
stats.domElement.style.right = 0;
stats.domElement.style.left = "initial";
document.body.appendChild(stats.dom);

init();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    200
  );
  camera.position.set(0, 2, 5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x99b6ec);
  scene.fog = new THREE.Fog(0x99b6ec, 10, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  // controls.autoRotate = true;
  controls.target.set(0, 2, 0);
  controls.update();

  addLights();
  addItems();
  makeAnimations();
  loadAssets();

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("click", onClick, false);
  animate();
}

function loadAssets() {
  var manager = new THREE.LoadingManager();
  new MTLLoader(manager)
    .setPath("assets/")
    .load("lowpolytree.mtl", function (materials) {
      materials.preload();

      new OBJLoader(manager)
        .setMaterials(materials)
        .setPath("assets/")
        .load(
          "lowpolytree.obj",
          function (object) {
            treeMesh = object.children[0];
            treeMesh.castShadow = true;
            // treeMesh.receiveShadow = true;
            treeMesh.geometry.applyMatrix4(
              new THREE.Matrix4().makeTranslation(0, 1.9, 0)
            );
            addTrees();
          },
          () => {},
          () => {}
        );
    });

  const finnTexture = new THREE.TextureLoader().load("assets/Finn.png");

  new OBJLoader(manager).setPath("assets/").load(
    "Finn.obj",
    function (object) {
      finnMesh = object.children[0];
      finnMesh.material.map = finnTexture;
      finnMesh.scale.set(0.03, 0.03, 0.03);
      finnMesh.position.set(0, -0.01, 2);
      finnMesh.castShadow = true;
      // finnMesh.receiveShadow = true;
      scene.add(object);
    },
    () => {},
    () => {}
  );
}

function addTrees() {
  const n = 7;
  for (let x = -n / 2; x < n / 2; x++) {
    for (let y = 1; y < 8; y++) {
      const treeOne = treeMesh.clone();
      treeOne.position.z = -y * 4 + (Math.random() * 2 - 1);
      treeOne.position.x = -x * 3.5 + (Math.random() * 2 - 1);
      scene.add(treeOne);
    }
  }
}

function onClick() {
  ctaElem.style.opacity = 0;
  if (isAnimating) {
    return;
  }
  if (zoomState) {
    inAnim();
  } else {
    outAnim();
  }
  isAnimating = true;
}

function outAnim() {
  fovOutAnim.start();
  zoomInAnim.start();
}

function inAnim() {
  fovInAnim.start();
  zoomOutAnim.start();
}

function makeAnimations() {
  const animationTime = 1000;
  const curve = TWEEN.Easing.Quadratic.In;

  fovOutAnim = new TWEEN.Tween(camera)
    .to({ fov: 110 }, animationTime)
    .easing(curve)
    .onUpdate(() => {
      camera.updateProjectionMatrix();
    });

  zoomInAnim = new TWEEN.Tween(camera.position)
    .to({ z: 3 }, animationTime)
    .easing(curve)
    .onComplete(() => {
      zoomState = 1;
      isAnimating = false;
    });

  fovInAnim = new TWEEN.Tween(camera)
    .to({ fov: 45 }, animationTime)
    .easing(curve)
    .onUpdate(() => {
      camera.updateProjectionMatrix();
    });

  zoomOutAnim = new TWEEN.Tween(camera.position)
    .to({ z: 5 }, animationTime)
    .easing(curve)
    .onComplete(() => {
      zoomState = 0;
      isAnimating = false;
    });
}

function addItems() {
  const geometry = new THREE.PlaneBufferGeometry(100, 100, 1);
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color("hsl(120, 30%, 30%)"),
    side: THREE.DoubleSide,
  });
  const ground = new THREE.Mesh(geometry, material);

  ground.receiveShadow = true;
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const sunGeometry = new THREE.CircleBufferGeometry(2, 32);
  var sunMaterial = new THREE.MeshBasicMaterial({ color: 0xecec1a });
  var sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(7, 16, -10);
  scene.add(sun);
}

function addLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  const topRight = new THREE.DirectionalLight(0xffff00, 0.7);
  topRight.position.set(7, 16, -10);
  topRight.castShadow = true;
  topRight.shadow.camera.top = 6;
  topRight.shadow.camera.bottom = -25;
  topRight.shadow.camera.left = -9;
  topRight.shadow.camera.right = 26;
  const topRightHelper = new THREE.DirectionalLightHelper(topRight, 1);
  scene.add(topRight);
  // scene.add(topRightHelper);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  stats.begin();

  controls.update();
  TWEEN.update();
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}
