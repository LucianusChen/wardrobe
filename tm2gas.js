// tm2gas.js  v1.2  @2025-01-05

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const url_tm = "https://teachablemachine.withgoogle.com/models/SFUM1-ESv/";
const url_gas = "https://script.google.com/macros/s/AKfycbzuxO5grUe_f0yi7EhfLRjYvFW8TFLqNyFeJXJDbT8rN8cRIrUGm40nyQsh3SBEULCX8Qx/exec";

let model, webcam, num_classes, max_class;
let keepGoing = true;
let names = [];
let probs = [];
let hints = [];

let div_webcam = document.getElementById("div_webcam");
let div_cloths = document.getElementById("div_cloths");
let img_cloths = document.getElementById("img_cloths");
let tbody = document.getElementById("result_rows");

// 停止相機
async function cam_stop() {
    keepGoing = false;
    if (webcam) {
        await webcam.stop();
        webcam = null;
    }
}

// 啟動相機並載入模型
async function cam_init() {
    keepGoing = true;

    // 確保相機功能可用
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("您的瀏覽器不支持相機功能，請升級或更換瀏覽器！");
        return;
    }

    const url_model = url_tm + "model.json";
    const url_metadata = url_tm + "metadata.json";

    try {
        // 加載模型
        model = await tmImage.load(url_model, url_metadata);
        num_classes = model.getTotalClasses();

        // 設置後置相機
        const flip = false; // 不翻轉畫面，使用後置相機
        webcam = new tmImage.Webcam(240, 240, flip, { facingMode: "environment" });
        await webcam.setup(); // 請求相機權限
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 更新 DOM
        div_webcam.innerHTML = "";
        div_webcam.appendChild(webcam.canvas);
        tbody.innerHTML = "";
        for (let i = 0; i < num_classes; i++) {
            let tr = tbody.appendChild(document.createElement("tr"));
            tr.appendChild(document.createElement("td")).innerHTML = i + 1;
            names[i] = tr.appendChild(document.createElement("td"));
            probs[i] = tr.appendChild(document.createElement("td"));
            hints[i] = tr.appendChild(document.createElement("td"));
            names[i].classList.add("text-start");
        }
    } catch (err) {
        alert("初始化相機或模型失敗：" + err.message);
        console.error(err);
    }
}

// 持續更新相機畫面與模型推論
async function loop() {
    if (keepGoing) {
        webcam.update(); // 更新相機影像
        await predict();
        window.requestAnimationFrame(loop);
    }
}

// 使用模型進行推論
async function predict() {
    let max_prob = 0;
    let max_item = 0;

    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < num_classes; i++) {
        names[i].innerHTML = prediction[i].className;
        probs[i].innerHTML = prediction[i].probability.toFixed(2);
        hints[i].innerHTML = "";

        if (prediction[i].probability > max_prob) {
            max_item = i;
            max_prob = prediction[i].probability;
            max_class = prediction[i].className;
        }
    }

    // 更新辨識結果
    if (max_prob > 0) {
        hints[max_item].innerHTML = "👑";
        img_cloths.src = `cloths/${max_class}.jpg`;
    }
}

// 傳送資料至 GAS
async function clothing(action) {
    if (!max_class) {
        alert("尚未進行 AI 視覺辨識！");
        return;
    }

    const cloths = max_class;
    try {
        const url = `${url_gas}?cloths=${cloths}&action=${action}`;
        const response = await fetch(url, { method: "GET" });

        if (response.ok) {
            if (action === "W") {
                alert(`【${cloths}】之日常著衣記錄傳送成功！`);
            } else if (action === "F") {
                alert(`相似於【${cloths}】之新購試衣記錄傳送成功！`);
            }
        } else {
            alert("GAS API 叫用錯誤！");
        }
    } catch (error) {
        console.error("發送時發生錯誤:", error);
        alert("發送時發生錯誤！");
    }
}

// 日常著衣
async function cloths_wearing() {
    await clothing("W");
}

// 新購試衣
async function cloths_fitting() {
    await clothing("F");
}