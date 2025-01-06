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

// Stop Loop
async function cam_stop() {
    keepGoing = false;
    await webcam.stop();
}

// Load the image model and setup the webcam
async function cam_init() {
    keepGoing = true;
    const url_model = url_tm + "model.json";
    const url_metadata = url_tm + "metadata.json";

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(url_model, url_metadata);
    num_classes = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(240, 240, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    div_webcam.innerHTML = "";
    div_webcam.appendChild(webcam.canvas);
    tbody.innerHTML = "";
    for (let i = 0; i < num_classes; i++) { // and class labels
        let tr = tbody.appendChild(document.createElement("tr"));
        tr.appendChild(document.createElement("td")).innerHTML = i + 1;
        names[i] = tr.appendChild(document.createElement("td"));
        probs[i] = tr.appendChild(document.createElement("td"));
        hints[i] = tr.appendChild(document.createElement("td"));
        names[i].classList.add('text-start');
    }
}

async function loop() {
    if (keepGoing) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }
}

// run the webcam image through the image model
async function predict() {
    let max_prob = 0;
    let max_item = 0;

    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < num_classes; i++) {
        names[i].innerHTML = prediction[i].className;
        probs[i].innerHTML = prediction[i].probability.toFixed(2);
        hints[i].innerHTML = '';

        if (prediction[i].probability > max_prob) {
            max_item = i;
            max_prob = prediction[i].probability;
            max_class = prediction[i].className;
        }
    }

    // 標示辨識結果、並顯示最符合的衣物圖片
    if (max_prob > 0) {
        hints[max_item].innerHTML = '👑';
        img_cloths.src = `cloths/${max_class}.jpg`;
    }
}

async function clothing(action) {
    if (! max_class)
        alert('尚未進行 AI 視覺辨識！');
    else {
        let cloths = max_class;
        try {
            url = `${url_gas}?cloths=${cloths}&action=${action}`;
            const response = await fetch(url, {
                method: 'GET',
            });

            if (response.ok) {
                if (action == 'W')
                    alert(`【${cloths}】之日常著衣記錄傳送成功！`);
                else if (action == 'F')
                    alert(`相似於【${cloths}】之新購試衣記錄傳送成功！`);
            } else {
                alert(`GAS API 叫用錯誤！`);
            }
        } catch (error) {
            console.error('發送時發生錯誤:', error);
            alert('發送時發生錯誤！');
        }
    }
}

async function cloths_wearing() {
    await clothing("W");
}

async function cloths_fitting() {
    await clothing("F");
}