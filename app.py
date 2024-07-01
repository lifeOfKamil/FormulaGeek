from flask import Flask, render_template, request, jsonify
import fastf1 as ff1
import pandas as pd
from logging import FileHandler, WARNING

app = Flask(__name__)

file_handler = FileHandler('error.txt')
file_handler.setLevel(WARNING)

ff1.Cache.enable_cache('cache')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_race_results', methods=['POST'])
def get_race_results():
    data = request.json
    year = data.get('year')
    race = data.get('race')

    if not year or not race:
        return jsonify({'error': 'Year and race are required'}), 400

    try:
        session = ff1.get_session(year, race, 'R')
        session.load()

        results = session.results
        print('Available columns:', results.columns)

        results_df = results[['Position', 'Abbreviation', 'Time', 'Points']].copy()

        # Convert 'Time' column to total seconds, handling NaN values
        results_df['Time'] = results_df['Time'].apply(lambda x: x.total_seconds() if pd.notnull(x) else '1 Lap')
        print(results_df)

        return jsonify(results_df.to_dict(orient='records'))
    except Exception as e:
        print('Error loading session data:', e)
        return jsonify({'error': str(e)}), 500
    

@app.route('/get_lap_data', methods=['POST'])
def get_lap_data():
    data = request.json
    year = data['year']
    race = data['race']
    session_type = data['session']
    driver1 = data['driver1']
    driver2 = data['driver2']

    session = ff1.get_session(year, race, session_type)
    session.load()

    driver1_laps = session.laps.pick_driver(driver1)
    driver2_laps = session.laps.pick_driver(driver2)

    driver1_laps = driver1_laps.dropna(subset=['LapTime'])
    driver2_laps = driver2_laps.dropna(subset=['LapTime'])

    df1 = pd.DataFrame({
        'Lap': driver1_laps['LapNumber'],
        'Lap Time': driver1_laps['LapTime'].dt.total_seconds(),
        'Driver': driver1
    })

    df2 = pd.DataFrame({
        'Lap': driver2_laps['LapNumber'],
        'Lap Time': driver2_laps['LapTime'].dt.total_seconds(),
        'Driver': driver2
    })

    df = pd.concat([df1, df2])

    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=False)
    
    