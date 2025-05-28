window.addEventListener("DOMContentLoaded", function () {
    let container = document.getElementById("main")
    let saveToJsonButton = document.getElementById("saveJsonButton")
    let loadToJsonButton = document.getElementById("loadJsonButton")
    let postDataButton = document.getElementById("postDataButton")
    let fillRandomButton = document.getElementById("fillRandomButton")
    let varBlock = createVarBlock();
    let funcBlock = createFuncBlock();
    let qFuncBlock = createQFuncBlock();

    let jsonData = localStorage.getItem("jsonData3")
    if (jsonData) {
        data = convertJsonToData(jsonData)
        varBlock.setData(data)
        funcBlock.setData(data)
        qFuncBlock.setData(data)
    }

    container.append(varBlock.block);
    container.append(funcBlock.block);
    container.append(qFuncBlock.block);

    saveToJsonButton.onclick = () => {
        saveJSONToFile(convertDataToJson(varBlock, funcBlock, qFuncBlock))
    }

    loadToJsonButton.onclick = () => {
        loadJSONFromFile()
            .then((result) => {
                let data = convertJsonToData(result)
                varBlock.setData(data)
                funcBlock.setData(data)
                qFuncBlock.setData(data)
            })
            .catch((e) => console.log(e))
    }

    fillBoundariesTable = () => {
        const table = document.querySelector('#boundaries_table');
        table.innerHTML = `
            <tr>
                <th>Имя</th>
                <th>Макс</th>
                <th>Мин</th>
            </tr>
        `;
        const data = varBlock.getData();
        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            const minValue = v[2];
            const maxValue = v[1];
            const row = document.createElement('tr');
            row.innerHTML = `
                <tr>
                    <td>X${i + 1}</td>
                    <td>${maxValue}</td>
                    <td>${minValue}</td>
                </tr> 
            `;
            table.appendChild(row);
        }
    }

    postDataButton.onclick = () => {
        fillBoundariesTable();
        postDataButton.disabled = true
        let body = convertDataToJson(varBlock, funcBlock, qFuncBlock)
        localStorage.setItem("jsonData3", body)
        postData("http://127.0.0.1:9090/calcAndDraw_hdd", body,
            () => {
                document.querySelectorAll('#imageGallery .plot').forEach(img => {
                    img.src += '?t=' + new Date().getTime();
                });
            },
            () => { },
            () => postDataButton.disabled = false)
    }

    fillRandomButton.onclick = async () => {
        const minValueStep = -0.001;
        const startValueStep = 0.05;
        var triesCount = 0;
        const maxTriesCount = 200;

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
        qFuncBlock.fillRandom(0.7);


        checkByServer = async () => {
            if (triesCount == maxTriesCount) {
                alert('Не удалось найти значения полиномов удовлетворяющие текущее выражение');
                return;
            }
            triesCount++;
            let body = convertDataToJson(varBlock, funcBlock, qFuncBlock)
            localStorage.setItem("jsonData3", body)
            const res = await fetch(new Request("http://127.0.0.1:9090/calcAndDraw_hdd", {
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
        fillBoundariesTable();
    }
});

function createVarBlock() {
    let varNames = [
        "Эффективность функционирования хранилища данных",
        "Качество программного обеспечения (ПО)",
        "Корректность ПО",
        "Надежность программного обеспечения",
        "Доступность программного обеспечения",
        "Возможность интенсивного использования ПО",
        "Прослеживаемость ПО",
        "Функциональная полнота ПО",
        "Обеспечение требуемой последовательности работ при проектировании хранилища",
        "Практичность ПО",
        "Устойчивость к ошибкам данных программного обеспечения",
        "Эффективность выполнения транзакций",
        "Степень мотивации персонала, осуществляющего эксплуатацию хранилища данных",
        "Удобство тестирования ПО"
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
    flArray.push(
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1,
        4, 6, 9, 10, 13,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 6, 9, 10,
        1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        1, 2, 3, 4, 8, 10, 12, 13, 14, 5, 6,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14,
        1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 9,
        5, 7, 11, 13, 14);
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
        return PolynomicCellName("X", flArray[i], "(t)", power - j)
    }

    return NewBlock(["Функции", "", "", "", ""], "x", rowNameFunc, cellNameFunc)
}


function createQFuncBlock() {
    let SIGMA_count = 5;

    let rowNameFunc = function (i) {
        if (i >= SIGMA_count) {
            return ""
        }

        return RowNameWithIndex("ζ", `${i + 1}`);
    }

    let cellNameFunc = function (i, j) {
        if (i >= SIGMA_count) {
            return "";
        }

        return PolynomicCellName("t", "", "", power - j)
    }

    return NewBlock(["Функция", "", "", "", ""], "qfunc", rowNameFunc, cellNameFunc)
}

function convertDataToJson(varBlock, funcBlock, qFuncBlock) {
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

    data = qFuncBlock.getData();
    for (let i = 0; i < data.length; i++) {
        result.q[i] = data[i]
    }

    return JSON.stringify(result)
}

function convertJsonToData(jsonString) {
    let data = {
        var: new Array(),
        x: new Array(),
        qfunc: new Array()
    }

    let parsedJson = JSON.parse(jsonString)
    for (let i = 0; i < parsedJson.start.length; i++) {
        data.var.push([parsedJson.start[i], parsedJson.max_values[i]])
    }

    for (let i = 0; i < parsedJson.q.length; i++) {
        data.qfunc.push(parsedJson.q[i])
    }

    for (let i = 0; i < parsedJson.coef.length; i++) {
        data.x.push(parsedJson.coef[i])
    }

    return data
}