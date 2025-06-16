from flask import Flask, render_template, request
from flask_cors import CORS
from calc_and_draw import CalculationDrawService

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app, origins="*")

calcS = CalculationDrawService()

@app.route("/")
def index():
    return render_template("index.html") 

@app.route('/check')
def check():
    return "check"


@app.route('/calcAndDraw', methods=['POST'])
def calc_and_draw():
    #  Получение данных с фронт энда
    content = request.json

    try:
        X, Y = calcS.calculate(content)
    except ValueError as e:
        # Не прошло проверку на min_values или max_values
        return {"error": f"Validation failed: {str(e)}"}, 400  

    # Отрисовка графиков
    path1 = calcS.save_plot(X, Y)
    path2 = calcS.save_petal_plots(0, Y, content["max_values"])

    return {
        "image1": path1,
        "image2": path2
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9090)
