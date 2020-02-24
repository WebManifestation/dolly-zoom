import * as THREE from "three";
import TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import Stats from 'stats.js';

let container, controls;
let camera, scene, renderer;
let cube;
let fovOutAnim, zoomInAnim;
let fovInAnim, zoomOutAnim;
let zoomState = 0;
let isAnimating = false;
let treeMesh, treeTest;

const stats = new Stats();
stats.domElement.style.right = 0;
stats.domElement.style.left = 'initial';
document.body.appendChild(stats.dom);

init();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 200);
  camera.position.set(0, 2, 8);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x99b6ec);
  scene.fog = new THREE.Fog(0x99b6ec, 10, 30);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputEncoding = THREE.sRGBEncoding

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

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('click', onClick, false);
  animate();
}

function loadAssets() {
  var manager = new THREE.LoadingManager();
  new MTLLoader(manager)
    .setPath('assets/')
    .load('lowpolytree.mtl', function (materials) {

      materials.preload();

      new OBJLoader(manager)
        .setMaterials(materials)
        .setPath('assets/')
        .load('lowpolytree.obj', function (object) {
          console.log(object);
          treeMesh = object.children[0];
          treeMesh.castShadow = true;
          treeMesh.receiveShadow = true;
          treeMesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1.9, 0));
          addTrees();
        }, () => {

        }, () => {

        });

    });
}

function addTrees() {
  // treeTest = treeMesh.clone();
  // scene.add(treeTest);
  const n = 8
  for (let x = - n / 2; x < n / 2; x++) {
    for (let y = 1; y < 8; y++) {
      const treeOne = treeMesh.clone();
      treeOne.position.z = -y * 4;
      treeOne.position.x = -x * 3;
      scene.add(treeOne);
    }
  }

  // const treeOne = treeMesh.clone();
  // treeOne.position.z = -8;
  // treeOne.position.x = -y * 3;
  // scene.add(treeOne);
}

function onClick() {

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

  const animationTime = 2000;
  const curve = TWEEN.Easing.Quadratic.In;

  fovOutAnim = new TWEEN.Tween(camera)
    .to({ fov: 100 }, animationTime)
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
    .to({ z: 8 }, animationTime)
    .easing(curve)
    .onComplete(() => {
      zoomState = 0;
      isAnimating = false;
    });
}

function addItems() {

  const color = new THREE.Color(`hsla(0, 30%, 70%, 1)`)

  const geometry = new THREE.PlaneBufferGeometry(100, 100, 1);
  const material = new THREE.MeshLambertMaterial({ color: 0x716a6a, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(geometry, material);

  ground.receiveShadow = true;
  ground.rotation.x = - Math.PI / 2;
  scene.add(ground);

  const colorCube = new THREE.Color(`hsla(260, 100%, 50%, 1)`);

  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: colorCube });
  cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  cube.position.y = 1.5;

  cube.receiveShadow = true;
  cube.castShadow = true;
  scene.add(cube);
}

function addLights() {

  const shadowSize = 8;

  const ambient = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambient);

  const topRight = new THREE.DirectionalLight(0xffffff, 0.5);
  topRight.position.set(4, 4, 4);
  topRight.castShadow = true;
  topRight.shadow.camera.top = shadowSize;
  topRight.shadow.camera.bottom = -shadowSize;
  topRight.shadow.camera.left = -shadowSize;
  topRight.shadow.camera.right = shadowSize;
  const topRightHelper = new THREE.DirectionalLightHelper(topRight, 1);
  scene.add(topRight);
  // scene.add(topRightHelper);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(0, 2, -6);
  // backLight.castShadow = true;
  // backLight.shadow.camera.top = shadowSize;
  // backLight.shadow.camera.bottom = -shadowSize;
  // backLight.shadow.camera.left = -shadowSize;
  // backLight.shadow.camera.right = shadowSize;
  const backLightHelper = new THREE.DirectionalLightHelper(backLight, 1);
  scene.add(backLight);
  // scene.add(backLightHelper);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  stats.begin();

  cube.rotation.y += 0.01;
  cube.rotation.x += 0.02;
  if (treeTest) {
    // treeTest.rotation.y += 0.01;
    // treeTest.rotation.x += 0.02;
  }
  controls.update();
  TWEEN.update();
  renderer.render(scene, camera);

  stats.end();
  requestAnimationFrame(animate);
}