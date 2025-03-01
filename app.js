// @ts-nocheck
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const FrameRate = document.getElementById("framerate");
const Buttons = {
    sand: document.getElementById("sand"),
    water: document.getElementById("water"),
    stone: document.getElementById("stone"),
    eraser: document.getElementById("eraser"),
};
let canvasData;

let WIDTH, HEIGHT;

const DOT_SIZE = 5;
let field = new Array(2);
let currentField = true;
function setup() {
    WIDTH = Math.ceil(window.innerWidth / DOT_SIZE);
    HEIGHT = Math.ceil(window.innerHeight / DOT_SIZE);

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    canvasData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    field[0] = new Array(WIDTH * HEIGHT).fill(null);
    field[1] = new Array(WIDTH * HEIGHT).fill(null);
}
setup();
window.addEventListener("resize", setup);

function grid(x, y, isNextGrid = false) {
    return field[isNextGrid ? +!currentField : +currentField][y * WIDTH + x];
}
function setGrid(x, y, v, isNextGrid = false) {
    field[isNextGrid ? +!currentField : +currentField][y * WIDTH + x] = v;
}
function makeNextField() {
    field[+!currentField] = field[+currentField].map((f) =>
        f
            ? {
                  ...f,
                  checked: false,
              }
            : null
    );
}
function swapAtNextGrid(x1, y1, x2, y2) {
    const temp = field[+!currentField][y1 * WIDTH + x1];
    field[+!currentField][y1 * WIDTH + x1] =
        field[+!currentField][y2 * WIDTH + x2];
    field[+!currentField][y2 * WIDTH + x2] = temp;
}
function swapIfEmpty(x, y, targetX, targetY, throughWater = false) {
    const targetDot = field[+!currentField][targetY * WIDTH + targetX];
    if (
        targetX >= 0 &&
        targetX < WIDTH &&
        targetY < HEIGHT &&
        (!targetDot || (throughWater && targetDot.type === "water"))
    ) {
        swapAtNextGrid(x, y, targetX, targetY);
        return true;
    }
    return false;
}

let prvTs = 0;
function frame(ts = 0) {
    FrameRate.innerText = Math.round(1000 / (ts - prvTs));
    prvTs = ts;
    draw();
    window.requestAnimationFrame(frame);
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function fallDot(x, y) {
    const current = grid(x, y, true);
    if (!current || current.checked) return;
    current.checked = true;
    if (current.type === "stone") return;
    const dir = current.dx ? current.dx : Math.random() >= 0.5 ? 1 : -1;
    current.dx = dir;
    if (current.type === "sand") {
        if (
            swapIfEmpty(x, y, x, y + 1 /*, current.type !== "water"*/) ||
            swapIfEmpty(x, y, x + dir, y + 1)
        )
            return;
        if (swapIfEmpty(x, y, x - dir, y + 1));
        current.dx *= -1;
    } else if (current.type === "water") {
        if (
            swapIfEmpty(x, y, x, y + 1, false) ||
            swapIfEmpty(x, y, x + dir, y + 1, false) ||
            swapIfEmpty(x, y, x + dir, y, false)
        )
            return;
        if (
            swapIfEmpty(x, y, x - dir, y + 1, false) ||
            swapIfEmpty(x, y, x - dir, y, false)
        ) {
            current.dx *= -1;
        } else current.dx = 0;
    }
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}
function genDot(type = currentTool) {
    if (currentTool === "sand")
        return {
            type: "sand",
            dx: 0,
            dy: 0,
            r: Math.floor(rand(180, 200)),
            g: 140,
            b: Math.floor(rand(110, 130)),
        };
    else if (currentTool === "water")
        return {
            type: "water",
            dx: 0,
            dy: 0,
            r: Math.floor(rand(0, 50)),
            g: Math.floor(rand(0, 50)),
            b: 245,
        };
    else if (currentTool === "stone")
        return {
            type: "stone",
            dx: 0,
            dy: 0,
            r: 100,
            g: 100,
            b: 100,
        };
    else if (currentTool === "eraser") return null;
}
const drawRadius = 5;
function draw() {
    ctx.fillStyle = "#000";
    ctx.clearRect(0, 0, WIDTH * DOT_SIZE, HEIGHT * DOT_SIZE);

    makeNextField();
    for (let y = HEIGHT - 1; y >= 0; y--) {
        for (
            let x = currentField ? 0 : WIDTH - 1;
            currentField ? x < WIDTH : x >= 0;
            currentField ? x++ : x--
        ) {
            if (
                isMouseDown &&
                getDistance(x, y, currentMousePos[0], currentMousePos[1]) <
                    drawRadius &&
                Math.random() >= 0
            )
                setGrid(x, y, genDot(), true);

            fallDot(x, y);
            const current = grid(x, y);
            const currentCanvasIdx = (y * WIDTH + x) * 4;
            canvasData.data[currentCanvasIdx] = current ? current.r : 0;
            canvasData.data[currentCanvasIdx + 1] = current ? current.g : 0;
            canvasData.data[currentCanvasIdx + 2] = current ? current.b : 0;
            canvasData.data[currentCanvasIdx + 3] = current ? 255 : 0;
        }
    }
    ctx.putImageData(canvasData, 0, 0);

    currentField = !currentField;
}

let isMouseDown = false;
let currentMousePos;
canvas.addEventListener("mousedown", (evt) => {
    isMouseDown = true;
    currentMousePos = [evt.clientX / DOT_SIZE, evt.clientY / DOT_SIZE];
});
canvas.addEventListener("mousemove", (evt) => {
    if (!isMouseDown) return;

    currentMousePos = [evt.clientX / DOT_SIZE, evt.clientY / DOT_SIZE];
});
canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
});

let currentTool = "sand";
for (const [key, value] of Object.entries(Buttons)) {
    value.addEventListener("click", () => {
        Buttons[currentTool].classList.remove("selected");
        currentTool = key;

        value.classList.add("selected");
    });
}

frame();
