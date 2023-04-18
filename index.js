const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");
const startDOM = document.getElementById("start");
let gameStopped = false;

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2,
  window.innerWidth / 2,
  window.innerHeight / 2,
  window.innerHeight / -2,
  0.1,
  10000
);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX =
  Math.tan(camera.rotation.y) *
  Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = new Texture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [
  { x: 0, y: 15, w: 10, h: 10 },
]);
const truckLeftSideTexture = new Texture(25, 30, [
  { x: 0, y: 5, w: 10, h: 10 },
]);

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    })
    .filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const chicken = new Chicken();
scene.add(chicken);

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

// scene.add(new BuildingLeft());
scene.add(new VanderbiltHall());

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

const laneTypes = ["car", "truck", "forest"];
const laneSpeeds = [2, 2.5, 3];
const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];
const threeHeights = [20, 45, 60];

const initializeValues = () => {
  lanes = generateLanes();

  currentLane = 0;
  currentColumn = Math.floor(columns / 2);
  counterDOM.innerHTML = currentLane;

  previousTimestamp = null;

  startMoving = false;
  moves = [];
  stepStartTimestamp;

  chicken.position.x = 0;
  chicken.position.y = 0;

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;
};

initializeValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function getRandomHexColor() {
  const HexValue = Math.floor(Math.random() * 0xffffff);
  return HexValue;
}

function getRandomSkinToneColor() {
  // Define the possible range of skin tones in RGB format
  var skinTones = [
    [255, 200, 150], // Lighter
    [250, 190, 140],
    [235, 170, 120],
    [220, 130, 100], // Medium
    [180, 100, 80],
    [140, 70, 50],
    [100, 40, 20], // Darker
  ];

  // Choose a random skin tone from the range
  var tone = skinTones[Math.floor(Math.random() * skinTones.length)];

  // Convert the RGB values to a hex string
  var hexString = ((1 << 24) + (tone[0] << 16) + (tone[1] << 8) + tone[2])
    .toString(16)
    .slice(1);

  return parseInt(hexString, 16);
}

function Texture(width, height, rects) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.6)";
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

function Wheel() {
  const wheel = new THREE.Mesh(
    new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
    new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
  );
  wheel.position.z = 6 * zoom;
  return wheel;
}

function BuildingLeft() {
  const buildingLeft = new THREE.Group();
  const color = getRandomHexColor();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("bg.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  // Create a box for the building
  const height = 100;
  const width = 1000;
  const depth = 100;
  const building = new THREE.Mesh(
    new THREE.BoxBufferGeometry(height * zoom, width * zoom, depth * zoom),
    new THREE.MeshPhongMaterial({ color, flatShading: true, map: texture })
  );
  building.position.z = height * zoom;
  building.position.x = -400 * zoom;
  building.castShadow = true;
  building.receiveShadow = true;
  buildingLeft.add(building);
  return buildingLeft;
}

function VanderbiltHall() {
  const vanderbiltHall = new THREE.Group();

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("brick.jpeg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  const vanderbiltTexture = textureLoader.load("vanderbilt.jpeg");
  vanderbiltTexture.wrapS = THREE.RepeatWrapping;
  vanderbiltTexture.wrapT = THREE.RepeatWrapping;
  vanderbiltTexture.repeat.set(1, 1);

  // Hex color for a light brown
  const lightBrown = 0x8b4513;

  // Hex color for a light blue
  const lightBlue = 0x87ceeb;

  // Create the main group for the building
  var building = new THREE.Group();

  // Define the size and shape of the building
  var width = 200 * zoom;
  var height = 200 * zoom;
  var depth = 100 * zoom;

  // Create the base of the building
  var baseGeometry = new THREE.BoxGeometry(width, depth, width);
  var baseMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: vanderbiltTexture,
  });
  var base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = depth / 2;
  building.add(base);

  // Create the main part of the building
  var mainGeometry = new THREE.BoxGeometry(width, height, depth);
  var mainMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: texture,
  });
  var main = new THREE.Mesh(mainGeometry, mainMaterial);
  main.position.y = depth + height / 2;
  main.position.z = height / 2;
  building.add(main);

  // Create a roof for the building
  var roofGeometry = new THREE.BoxGeometry(width, depth, width);
  var roofMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: vanderbiltTexture,
  });
  var roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = depth + height * 1.25;
  building.add(roof);

  building.position.x = Math.random() > 0.5 ? -boardWidth : boardWidth;

  return building;
}

function Professor() {
  const chicken = new THREE.Group();

  const rightLeg = new THREE.Mesh(
    new THREE.BoxBufferGeometry(5 * zoom, 5 * zoom, 12 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x0e5097, flatShading: true })
  );
  rightLeg.position.z = 7 * zoom;
  rightLeg.position.x = 4 * zoom;
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  chicken.add(rightLeg);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxBufferGeometry(5 * zoom, 5 * zoom, 12 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x0e5097, flatShading: true })
  );
  leftLeg.position.z = 7 * zoom;
  leftLeg.position.x = -4 * zoom;
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  chicken.add(leftLeg);

  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15 * zoom, 9 * zoom, 18 * zoom),
    new THREE.MeshPhongMaterial({
      color: getRandomHexColor(),
      flatShading: true,
    })
  );
  body.position.z = 22 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  chicken.add(body);

  const armColor = getRandomSkinToneColor();
  const leftArm = new THREE.Mesh(
    new THREE.BoxBufferGeometry(4 * zoom, 4 * zoom, 11 * zoom),
    new THREE.MeshPhongMaterial({ color: armColor, flatShading: true })
  );
  leftArm.position.z = 25 * zoom;
  leftArm.position.x = -9 * zoom;
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  chicken.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxBufferGeometry(4 * zoom, 4 * zoom, 11 * zoom),
    new THREE.MeshPhongMaterial({ color: armColor, flatShading: true })
  );
  rightArm.position.z = 25 * zoom;
  rightArm.position.x = 9 * zoom;
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  chicken.add(rightArm);

  // Gray color
  const gray = 0x808080;

  //Load the texture in "oldman.jpeg"
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("oldman.jpeg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  const head = new THREE.Mesh(
    new THREE.BoxBufferGeometry(10 * zoom, 10 * zoom, 10 * zoom),
    new THREE.MeshLambertMaterial({
      // color: gray,
      flatShading: true,
      map: texture,
    })
  );
  head.position.z = 34 * zoom;
  head.castShadow = true;
  head.receiveShadow = false;
  chicken.add(head);

  return chicken;
}

function Tree() {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
  );
  trunk.position.z = 10 * zoom;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

  const crown = new THREE.Mesh(
    new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
    new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
  );
  crown.position.z = (height / 2 + 20) * zoom;
  crown.castShadow = true;
  crown.receiveShadow = false;
  tree.add(crown);

  return tree;
}

function Chicken() {
  const chicken = new THREE.Group();

  const rightLeg = new THREE.Mesh(
    new THREE.BoxBufferGeometry(5 * zoom, 5 * zoom, 12 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x0e5097, flatShading: true })
  );
  rightLeg.position.z = 7 * zoom;
  rightLeg.position.x = 4 * zoom;
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  chicken.add(rightLeg);

  const leftLeg = new THREE.Mesh(
    new THREE.BoxBufferGeometry(5 * zoom, 5 * zoom, 12 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x0e5097, flatShading: true })
  );
  leftLeg.position.z = 7 * zoom;
  leftLeg.position.x = -4 * zoom;
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  chicken.add(leftLeg);

  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(15 * zoom, 9 * zoom, 18 * zoom),
    new THREE.MeshPhongMaterial({
      color: getRandomHexColor(),
      flatShading: true,
    })
  );
  body.position.z = 22 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  chicken.add(body);

  const armColor = getRandomSkinToneColor();
  const leftArm = new THREE.Mesh(
    new THREE.BoxBufferGeometry(4 * zoom, 4 * zoom, 11 * zoom),
    new THREE.MeshPhongMaterial({ color: armColor, flatShading: true })
  );
  leftArm.position.z = 25 * zoom;
  leftArm.position.x = -9 * zoom;
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  chicken.add(leftArm);

  const rightArm = new THREE.Mesh(
    new THREE.BoxBufferGeometry(4 * zoom, 4 * zoom, 11 * zoom),
    new THREE.MeshPhongMaterial({ color: armColor, flatShading: true })
  );
  rightArm.position.z = 25 * zoom;
  rightArm.position.x = 9 * zoom;
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  chicken.add(rightArm);

  // Random number in the range 8-16
  const headSize = Math.floor(Math.random() * 8 + 8) * zoom;

  // Load the texture in "yalefreshman.jpeg"
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("yalefreshman.jpeg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  const head = new THREE.Mesh(
    new THREE.BoxBufferGeometry(headSize, headSize, headSize),
    new THREE.MeshLambertMaterial({
      flatShading: true,
      map: texture,
    })
  );
  head.position.z = 34 * zoom;
  head.castShadow = true;
  head.receiveShadow = false;
  chicken.add(head);

  return chicken;
}

function Road() {
  const road = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x393d49);
  left.position.x = -boardWidth * zoom;
  road.add(left);

  const right = createSection(0x393d49);
  right.position.x = boardWidth * zoom;
  road.add(right);

  return road;
}

function Grass() {
  const grass = new THREE.Group();

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        boardWidth * zoom,
        positionWidth * zoom,
        3 * zoom
      ),
      new THREE.MeshPhongMaterial({ color })
    );

  const middle = createSection(0xbaf455);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x99c846);
  left.position.x = -boardWidth * zoom;
  grass.add(left);

  const right = createSection(0x99c846);
  right.position.x = boardWidth * zoom;
  grass.add(right);

  grass.position.z = 1.5 * zoom;
  return grass;
}

function Lane(index) {
  this.index = index;
  this.type =
    index <= 0
      ? "field"
      : laneTypes[Math.floor(Math.random() * laneTypes.length)];

  switch (this.type) {
    case "field": {
      this.type = "field";
      this.mesh = new Grass();
      break;
    }
    case "forest": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      this.threes = [1, 2, 3, 4].map(() => {
        const three = new Tree();
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        three.position.x =
          (position * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        this.mesh.add(three);
        return three;
      });
      break;
    }
    case "car": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vechicles = [1, 2, 3].map(() => {
        const vechicle = new Chicken();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vechicle.position.x =
          (position * positionWidth * 2 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vechicle.rotation.z = Math.PI;
        this.mesh.add(vechicle);
        return vechicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "truck": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vechicles = [1, 2].map(() => {
        const vechicle = new Professor();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 3);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vechicle.position.x =
          (position * positionWidth * 3 + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2;
        if (!this.direction) vechicle.rotation.z = Math.PI;
        this.mesh.add(vechicle);
        return vechicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
  }
}

document.querySelector("#start").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initializeValues();
  startDOM.style.visibility = "hidden";
});

document.querySelector("#end").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initializeValues();
  endDOM.style.visibility = "hidden";
});

window.addEventListener("keydown", (event) => {
  if (event.keyCode == "38") {
    // up arrow
    move("forward");
  } else if (event.keyCode == "40") {
    // down arrow
    move("backward");
  } else if (event.keyCode == "37") {
    // left arrow
    move("left");
  } else if (event.keyCode == "39") {
    // right arrow
    move("right");
  }
});

function move(direction) {
  const finalPositions = moves.reduce(
    (position, move) => {
      if (move === "forward")
        return { lane: position.lane + 1, column: position.column };
      if (move === "backward")
        return { lane: position.lane - 1, column: position.column };
      if (move === "left")
        return { lane: position.lane, column: position.column - 1 };
      if (move === "right")
        return { lane: position.lane, column: position.column + 1 };
    },
    { lane: currentLane, column: currentColumn }
  );

  if (direction === "forward") {
    if (
      lanes[finalPositions.lane + 1].type === "forest" &&
      lanes[finalPositions.lane + 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
    addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (
      lanes[finalPositions.lane - 1].type === "forest" &&
      lanes[finalPositions.lane - 1].occupiedPositions.has(
        finalPositions.column
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column - 1
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (
      lanes[finalPositions.lane].type === "forest" &&
      lanes[finalPositions.lane].occupiedPositions.has(
        finalPositions.column + 1
      )
    )
      return;
    if (!stepStartTimestamp) startMoving = true;
  }
  moves.push(direction);
}

function animate(timestamp) {
  requestAnimationFrame(animate);

  if (!previousTimestamp) previousTimestamp = timestamp;
  const delta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  // Animate cars and trucks moving on the lane
  lanes.forEach((lane) => {
    if (lane.type === "car" || lane.type === "truck") {
      const aBitBeforeTheBeginingOfLane =
        (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOFLane =
        (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.vechicles.forEach((vechicle) => {
        if (lane.direction) {
          vechicle.position.x =
            vechicle.position.x < aBitBeforeTheBeginingOfLane
              ? aBitAfterTheEndOFLane
              : (vechicle.position.x -= (lane.speed / 16) * delta);
        } else {
          vechicle.position.x =
            vechicle.position.x > aBitAfterTheEndOFLane
              ? aBitBeforeTheBeginingOfLane
              : (vechicle.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp) {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const moveDeltaDistance =
      Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
    const jumpDeltaDistance =
      Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
    switch (moves[0]) {
      case "forward": {
        const positionY =
          currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY; // initial chicken position is 0

        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "backward": {
        positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;

        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "left": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 -
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX; // initial chicken position is 0
        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "right": {
        const positionX =
          (currentColumn * positionWidth + positionWidth / 2) * zoom -
          (boardWidth * zoom) / 2 +
          moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;

        chicken.position.z = jumpDeltaDistance;
        break;
      }
    }
    // Once a step has ended
    if (moveDeltaTime > stepTime) {
      switch (moves[0]) {
        case "forward": {
          currentLane++;
          counterDOM.innerHTML = currentLane;
          break;
        }
        case "backward": {
          currentLane--;
          counterDOM.innerHTML = currentLane;
          break;
        }
        case "left": {
          currentColumn--;
          break;
        }
        case "right": {
          currentColumn++;
          break;
        }
      }
      moves.shift();
      // If more steps are to be taken then restart counter otherwise stop stepping
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }

  // Hit test
  if (
    lanes[currentLane].type === "car" ||
    lanes[currentLane].type === "truck"
  ) {
    const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
    const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
    const vechicleLength = { car: 20, truck: 20 }[lanes[currentLane].type];
    lanes[currentLane].vechicles.forEach((vechicle) => {
      const carMinX = vechicle.position.x - (vechicleLength * zoom) / 2;
      const carMaxX = vechicle.position.x + (vechicleLength * zoom) / 2;
      if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
        endDOM.style.visibility = "visible";
      }
    });
  }
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
