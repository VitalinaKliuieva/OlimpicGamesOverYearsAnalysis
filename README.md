# Olympic Games Over Years Analysis Dashboard

An interactive data analytics dashboard exploring the history of the Olympic Games from Athens 1896 to Rio 2016.

## About the Project

I created **Olympic Games Over Years Analysis** to explore historical Olympic data and better understand how the Games have evolved over time. The project focuses on athlete participation, gender representation, countries, sports, and medal-related trends across different Olympic editions.

My goal was to build an interactive analytics application that makes historical data easier to explore and interpret through visualizations, filters, and statistical summaries.

The application combines a Python data-processing backend with an Angular frontend, allowing me to analyze the dataset and present the results through an interactive dashboard.

## Project Objectives

Through this project, I aim to:

- Explore the development of the Olympic Games across different years and seasons.
- Analyze athlete participation and changes in gender representation.
- Compare participation and medal-related statistics across countries.
- Investigate the distribution of athletes across sports and events.
- Identify historical patterns and trends in Olympic data.
- Practice data analysis, API development, and interactive dashboard design.

## Dataset

The project uses the historical Olympic Games athlete dataset provided by Maven Analytics.

The dataset covers Olympic editions from **1896 to 2016**, including information about athletes, their national teams, sports, events, and competition results.

The analysis uses available fields such as:

- Athlete name and gender
- Age, height, and weight, where available
- National team and National Olympic Committee (NOC) code
- Olympic Games year and season
- Sport and event
- Medal result

The dataset contains historical records, so some attributes may be missing. I account for data availability when processing and interpreting the results.

## Technologies

### Backend and data analysis

- **Python** — application logic and data processing
- **Pandas** — data cleaning, transformation, grouping, and aggregation
- **NumPy** — numerical operations and statistical calculations
- **FastAPI** — REST API for serving processed data
- **Uvicorn** — local ASGI development server

### Frontend and visualization

- **Angular** — interactive dashboard interface
- **TypeScript** — frontend logic and type safety
- **HTML and CSS** — application structure and styling
- **Plotly.js** — interactive charts and data visualization

## Main Features

### Overview

The overview presents key statistics about the Olympic Games and provides a starting point for exploring the dataset.

### Participation Analysis

This section focuses on athlete participation over time, including comparisons across Olympic years and seasons and changes in gender representation.

### Countries and Medals

This section allows me to explore country-level participation and medal-related statistics, compare results, and investigate changes across Olympic editions.

Medal statistics are interpreted in the context of the available historical records and the selected filters.

### Events and Sports

This section explores the sports represented in the dataset and how their participation patterns have changed throughout Olympic history.

### Interactive Filtering

The dashboard includes filters for dimensions such as Olympic season, year range, country, and sport. These filters help narrow the analysis to specific periods and groups.

### Data API

The FastAPI backend exposes endpoints that supply processed data to the frontend. This keeps data preparation separate from the presentation layer and allows the dashboard to retrieve the information it needs.

## Project Structure

```text
olympic-analytics/
├── backend/
│   ├── data/
│   │   └── athlete_events.csv
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api.service.ts
│   │   │   ├── app.component.ts
│   │   │   └── chart.component.ts
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Running the Application Locally

### Requirements

- Python 3.10 or newer
- Node.js and npm
- The Maven Analytics Olympic Games dataset

### 1. Prepare the dataset

Place the CSV file in the backend data directory:

`backend/data/athlete_events.csv`

The backend also supports the alternative filename `olympics_history.csv`. If the file is stored elsewhere, configure the `OLYMPICS_CSV` environment variable to point to it.

### 2. Start the backend

From the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API will be available at:

- API base URL: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 3. Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm start
```

Open the local address displayed by Angular in the terminal, typically `http://localhost:4200`.

Keep both development servers running while using the application.

## Analytical Considerations

I treat the visualizations as exploratory analysis rather than as definitive explanations of historical changes.

A few considerations are especially important:

- **Athlete records versus unique athletes:** a dataset row can represent an athlete's participation in a particular event, so record counts should not automatically be interpreted as unique athlete counts.
- **Medal statistics:** medal totals depend on the aggregation method, selected filters, and treatment of team events.
- **Country comparisons:** historical NOC codes and national team identities do not always correspond directly to modern countries.
- **Missing values:** age, height, weight, and other attributes are not available for every record.
- **Historical context:** differences between Olympic editions can reflect changes in the number of events, participating nations, sports, and data coverage.

These considerations help ensure that the results are interpreted in the context of the dataset rather than taken at face value.

## Future Improvements

Potential extensions to the project include:

- Additional statistical indicators and deeper historical comparisons.
- More detailed athlete and country profiles.
- Improved medal and participation trend analysis.
- More advanced filtering and data export options.
- Automated tests and expanded API documentation.
- Deployment so the dashboard can be accessed without running it locally.

## Conclusion

Olympic Games Over Years Analysis combines data analysis, API development, and interactive visualization in one application. Building it allows me to explore more than a century of Olympic history while developing practical skills in Python, Pandas, NumPy, Angular, and data storytelling.

The project demonstrates how a historical dataset can be transformed into an interactive analytical tool that supports exploration, comparison, and a better understanding of long-term sporting trends.