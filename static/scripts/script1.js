window.addEventListener("DOMContentLoaded", function () {
    let container = document.getElementById("main")
    let saveToJsonButton = document.getElementById("saveJsonButton")
    let loadToJsonButton = document.getElementById("loadJsonButton")
    let postDataButton = document.getElementById("postDataButton")
    let fillRandomButton = document.getElementById("fillRandomButton")
    let varBlock = createVarBlock();
    let funcBlock = createFuncBlock();

    let jsonData = localStorage.getItem("jsonData1")
    if (jsonData) {
        data = convertJsonToData(jsonData)
        varBlock.setData(data)
        funcBlock.setData(data)
    }

    container.append(varBlock.block);
    container.append(funcBlock.block);

    saveToJsonButton.onclick = () => {
        saveJSONToFile(convertDataToJson(varBlock, funcBlock))
    }

    loadToJsonButton.onclick = () => {
        loadJSONFromFile()
            .then((result) => {
                let data = convertJsonToData(result)
                varBlock.setData(data)
                funcBlock.setData(data)
            })
            .catch((e) => console.log(e))
    }

    // fillBoundariesTable = () => {
    //     const table = document.querySelector('#boundaries_table');
    //     table.innerHTML = `
    //         <tr>
    //             <th>Имя</th>
    //             <th>Макс</th>
    //             <th>Мин</th>
    //         </tr>
    //     `;
    //     const data = varBlock.getData();
    //     for (let i = 0; i < data.length; i++) {
    //         const v = data[i];
    //         const minValue = v[2];
    //         const maxValue = v[1];
    //         const row = document.createElement('tr');
    //         row.innerHTML = `
    //             <tr>
    //                 <td>L${i + 1}</td>
    //                 <td>${maxValue}</td>
    //                 <td>${minValue}</td>
    //             </tr>
    //         `;
    //         table.appendChild(row);
    //     }
    // }

    postDataButton.onclick = () => {
        // fillBoundariesTable();
        postDataButton.disabled = true
        document.getElementById("loader").style.display = "block";
        let body = convertDataToJson(varBlock, funcBlock)
        localStorage.setItem("jsonData1", body)
        postData("http://127.0.0.1:9090/calcAndDraw", body,
            () => {
                document.querySelectorAll('#imageGallery .plot').forEach(img => {
                    img.src += '?t=' + new Date().getTime();
                });
            },
            () => { },
            () => {
                document.getElementById("loader").style.display = "none";
                postDataButton.disabled = false
            })
    }

    fillRandomButton.onclick = async () => {
        const minValueStep = -0.001;
        const startValueStep = 0.05;
        var triesCount = 0;
        const maxTriesCount = 200;
        document.getElementById("loader").style.display = "block";
        randomizeRow = (inputs) => {
            console.log(inputs);
            const minValueInput = inputs[2];
            const startValueInput = inputs[0];
            const maxValueInput = inputs[1];
            var minValue = +minValueInput.value;
            var maxValue = +maxValueInput.value;
            var startValue = +startValueInput.value;
            minValue = randomChanced(0.2, 0.5, 0);
            maxValue = randomChanced(0, 1, 0.5);
            startValue = randomChanced(0, maxValue, minValue);
            startValueInput.value = startValue;
            maxValueInput.value = maxValue;
            minValueInput.value = minValue;
        }


        varBlock.fillRandom(0.85, randomizeRow)
        funcBlock.fillRandom(0.5);


        checkByServer = async () => {
            if (triesCount == maxTriesCount) {
                alert('Кол-во попыток подбора превышено, попробуйте снова');
                return;
            }
            triesCount++;
            let body = convertDataToJson(varBlock, funcBlock)
            localStorage.setItem("jsonData3", body)
            const res = await fetch(new Request("http://127.0.0.1:9090/calcAndDraw", {
                method: "POST",
                body: body,
                headers: {
                    'Accept': 'application/json, text/plain',
                    'Content-Type': 'application/json;charset=UTF-8'
                },
            }
            ));
            if (res.status == 400) {
                funcBlock.fillRandom(0.5);
                await checkByServer();
            }
            else {
                document.querySelectorAll('#imageGallery .plot').forEach(img => {
                    img.src += '?t=' + new Date().getTime();
                });
            }
        }

        await checkByServer();
        // fillBoundariesTable();
        document.getElementById("loader").style.display = "none";
    }
});

function createVarBlock() {
    let varNames = [
        "Летальность",
        "Численность инфицированных",
        "Численность населения региона",
        "Численность госпитализированных",
        "Изолированность",
        "Скорость распространения",
        "Доступность лекарства",
        "Тяжесть симптомов",
        "Количество умерших от заболевания",
        "Уровень медицины",
        "Длительность инкубационного периода",
        "Длительность периода полного развития болезни",
        "Длительность реабилитационного периода",
        "Устойчивость вируса к лекарствам",
        "Степень осложнений заболевания"
    ]

    let rowNameFunc = function (i) {
        if (i >= varNames.length) {
            return ""
        }

        return varNames[i];
    }

    let cellNameFunc = function (i, j) {
        if (i >= varNames.length) {
            return "";
        }

        return " ";
    }

     return NewBlock(["Название переменной", "Начальное значение", "Предельное значение", "Минимальное значение"], "var", rowNameFunc, cellNameFunc)
}

function createFuncBlock() {
    let flArray = new Array();
    flArray.push(3, 1, 4, 6, 7, 6, 10, 14, 5, 2, 6, 2, 14, 2, 13, 15, 9, 13, 15, 1, 7, 14, 12, 13, 7, 8, 12, 9);
    power = 3;

    rowNameFunc = function (i) {
        if (i >= flArray.length) {
            return "";
        }
        return RowNameWithIndex("f", i + 1)
    }

    cellNameFunc = function (i, j) {
        if (i >= flArray.length) {
            return "";
        }
        return PolynomicCellName("L", flArray[i], "(t)", power - j)
    }

    return NewBlock(["Функции", "", "", "", ""], "x", rowNameFunc, cellNameFunc)
}

function convertDataToJson(varBlock, funcBlock) {
    let result = {
        start: new Array(0),
        max_values: new Array(0),
        coef: new Array(0),
        q: new Array(0),
        min_values: new Array(0),
    }

    var data = varBlock.getData()
    for (let i = 0; i < data.length; i++) {
        result.start.push(data[i][0])
        result.max_values.push(data[i][1])
        result.min_values.push(data[i][2])
    }

    data = funcBlock.getData();
    for (let i = 0; i < data.length; i++) {
        result.coef[i] = data[i]
    }

    return JSON.stringify(result)
}

function convertJsonToData(jsonString) {
    let data = {
        var: new Array(),
        x: new Array()
    }

    let parsedJson = JSON.parse(jsonString)
    for (let i = 0; i < parsedJson.start.length; i++) {
        data.var.push([parsedJson.start[i], parsedJson.max_values[i]])
    }

    for (let i = 0; i < parsedJson.coef.length; i++) {
        data.x.push(parsedJson.coef[i])
    }

    return data
}

