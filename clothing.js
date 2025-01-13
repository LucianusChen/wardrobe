// clothing.js  v2.2  @2025-01-08

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const url_tm = "https://teachablemachine.withgoogle.com/models/SFUM1-ESv/";
const url_wearing = "https://script.google.com/macros/s/AKfycbzuxO5grUe_f0yi7EhfLRjYvFW8TFLqNyFeJXJDbT8rN8cRIrUGm40nyQsh3SBEULCX8Qx/exec";
const url_fitting = "https://script.google.com/macros/s/AKfycbyagmfUq7C28TFPrIsNDZBqLlKmVzsTG_leDsGbDcJlbySYpwjCk1LgayLdhD8Mf943gQx/exec";

let model, webcam, num_classes, max_class;
let keepGoing = true;
let names = [];
let probs = [];
let hints = [];

let div_webcam = document.getElementById("div_webcam");
let div_cloths = document.getElementById("div_cloths");
let img_cloths = document.getElementById("img_cloths");
let tbody = document.getElementById("result_rows");


document.getElementById('modal_close1').addEventListener('click', function () {
    document.getElementById('modal_cloths').style.display = 'none';
});

document.getElementById('modal_close1').addEventListener('click', function () {
    document.getElementById('modal_cloths').style.display = 'none';
});


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

        let td = document.createElement("td");
        td.classList.add('text-end');
        td.classList.add('pe-3');
        tr.appendChild(td).innerHTML = i + 1;

        names[i] = tr.appendChild(document.createElement("td"));
        names[i].classList.add('text-start');
        names[i].classList.add('ps-3');

        probs[i] = tr.appendChild(document.createElement("td"));
        probs[i].classList.add('text-end');
        probs[i].classList.add('pe-3');

        hints[i] = tr.appendChild(document.createElement("td"));
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
        probs[i].innerHTML = (prediction[i].probability * 100).toFixed(2).toString() + " %";
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


async function cloths_wearing() {
    if (!max_class) {
        alert('尚未進行 AI 視覺辨識！');
        return;
    }

    let cloths_id = max_class;

    try {
        let url = `${url_wearing}?cloths=${cloths_id}`;
        const response = await fetch(url);
        if (response.ok) {
            alert(`【${cloths_id}】之日常著衣記錄傳送成功！`);
        } else {
            alert(`GAS API 叫用錯誤！`);
        }
    } catch (error) {
        console.error('發送時發生錯誤:', error);
        alert('發送時發生錯誤！');
    }
}


async function cloths_fitting() {
    if (!max_class) {
        alert('尚未進行 AI 視覺辨識！');
        return;
    }

    let cloths_id = max_class;

    // URL of the deployed Google Apps Script
    let url = `${url_fitting}?cloths=${cloths_id}`;
    let details;

    // Fetch cloths information
    await fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById("cloths_Details").innerText = "Error: " + data.error;
            } else {
                local_date = new Date(data.date_purchase).toLocaleDateString();
                utilization_percent = (data.utilization * 100).toFixed(2);
                details = `
                <div class="row">
                  <div class="col text-nowrap mt-2">
                    <strong>衣物代碼：</strong> ${data.id} <br>
                    <strong>衣物名稱：</strong> ${data.name} <br>
                    <strong>購買日期：</strong> ${local_date} <br>
                    <strong>購入天數：</strong> ${data.days_passed} <br>
                    <strong>穿著次數：</strong> ${data.num_wears} <br>
                    <strong>利用率：</strong> ${utilization_percent} %
                  </div>
                  <div class="col-auto mt-2">
                    <img id="img_cloths" alt="" src="cloths/${cloths_id}.jpg" width="160" height="160"></img>
                  </div>
                </div>
                `;
                document.getElementById("cloths_Details").innerHTML = details;
            }
        })
        .catch(error => {
            document.getElementById("cloths_Details").innerText = "Error fetching cloths information.";
            console.error("Error:", error);
        });

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById("modal_cloths"));
    modal.show();
}