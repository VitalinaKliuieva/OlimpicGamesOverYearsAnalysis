from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("OLYMPICS_DATA_DIR", APP_DIR / "data"))
CSV_OVERRIDE = os.getenv("OLYMPICS_CSV")

app = FastAPI(
    title="Olympic Games Analytics API",
    description="Exploratory analytics for the modern Olympic Games, 1896–2016.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA: pd.DataFrame | None = None
DATA_FILE: str | None = None


def _find_csv() -> Path:
    if CSV_OVERRIDE:
        path = Path(CSV_OVERRIDE).expanduser().resolve()
        if path.exists():
            return path
        raise FileNotFoundError(f"OLYMPICS_CSV points to a missing file: {path}")

    preferred = [
        DATA_DIR / "athlete_events.csv",
    ]
    for path in preferred:
        if path.exists():
            return path

    candidates = sorted(DATA_DIR.glob("*.csv")) if DATA_DIR.exists() else []
    if len(candidates) == 1:
        return candidates[0]
    if candidates:
        names = ", ".join(p.name for p in candidates)
        raise FileNotFoundError(
            f"More than one CSV found in {DATA_DIR}. Set OLYMPICS_CSV or use "
            f"athlete_events.csv. Found: {names}"
        )
    raise FileNotFoundError(
        f"No CSV file found. Place the Olympic athlete/event CSV in {DATA_DIR}, "
        "or set the OLYMPICS_CSV environment variable."
    )


def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map common Maven/Kaggle column names into a consistent internal schema."""
    df = df.copy()
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    aliases = {
        "id": ["ID"],
        "name": ["Name"],
        "sex": ["Sex"],
        "age": ["Age"],
        "height": ["Height"],
        "weight": ["Weight"],
        "team": ["Team"],
        "noc": ["NOC"],
        "games": ["Games"],
        "year": ["Year"],
        "season": ["Season"],
        "city": ["City"],
        "sport": ["Sport"],
        "event": ["Event"],
        "medal": ["Medal"],
    }


    required = ["year", "season", "sport", "event"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(
            f"CSV is missing required columns: {missing}. "
            "Expected fields similar to Year, Season, Sport, and Event."
        )

    defaults: dict[str, Any] = {
        "id": np.nan, "name": "Unknown", "sex": "U", "age": np.nan,
        "height": np.nan, "weight": np.nan, "team": "Unknown",
        "games": "", "city": "Unknown", "medal": "NA",
    }
    for col, default in defaults.items():
        if col not in df.columns:
            df[col] = default

    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    df = df.dropna(subset=["year"]).copy()
    df["year"] = df["year"].astype(int)
    for col in ["season", "sport", "event", "team", "sex", "medal", "city", "name", "games"]:
        df[col] = df[col].fillna("Unknown").astype(str).str.strip()
    df["season"] = df["season"].str.title()
    df["sex"] = df["sex"].str.upper()
    df["medal"] = df["medal"].replace({"nan": "NA", "None": "NA", "": "NA"})
    df["id"] = pd.to_numeric(df["id"], errors="coerce")
    for col in ["age", "height", "weight"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def _load_data(force: bool = False) -> pd.DataFrame:
    global DATA, DATA_FILE
    if DATA is not None and not force:
        return DATA
    path = _find_csv()
    try:
        raw = pd.read_csv(path, low_memory=False)
        DATA = _standardize_columns(raw)
    except Exception as exc:
        raise RuntimeError(f"Could not load {path.name}: {exc}") from exc
    DATA_FILE = str(path)
    return DATA


def _filtered(
    season: str = "All",
    start_year: int | None = None,
    end_year: int | None = None,
    country: str = "All",
    sport: str = "All",
) -> pd.DataFrame:
    df = _load_data().copy()
    if season != "All":
        df = df[df["season"].str.casefold() == season.casefold()]
    if start_year is not None:
        df = df[df["year"] >= start_year]
    if end_year is not None:
        df = df[df["year"] <= end_year]
    if country != "All":
        df = df[df["team"] == country]
    if sport != "All":
        df = df[df["sport"] == sport]
    return df


def _safe_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert pandas/numpy values to JSON-safe Python primitives."""
    clean = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    return clean.to_dict(orient="records")


def _athlete_count(df: pd.DataFrame) -> int:
    # Prefer athlete IDs when available; fall back to names for source variants.
    ids = df["id"].dropna()
    if len(ids):
        return int(ids.nunique())
    return int(df["name"].replace("Unknown", np.nan).dropna().nunique())


@app.get("/")
def root():
    return {"message": "Olympic Games Analytics API", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    try:
        df = _load_data()
        return {
            "status": "ok",
            "rows": int(len(df)),
            "source_file": Path(DATA_FILE).name if DATA_FILE else None,
            "year_min": int(df["year"].min()),
            "year_max": int(df["year"].max()),
        }
    except Exception as exc:
        return {"status": "data_not_ready", "message": str(exc)}


@app.get("/api/metadata")
def metadata():
    try:
        df = _load_data()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    seasons = sorted(df["season"].dropna().unique().tolist())
    return {
        "years": sorted(int(y) for y in df["year"].unique()),
        "seasons": seasons,
        "countries": sorted(df["team"].dropna().unique().tolist()),
        "sports": sorted(df["sport"].dropna().unique().tolist()),
        "source_file": Path(DATA_FILE).name if DATA_FILE else None,
        "rows": int(len(df)),
    }


@app.get("/api/overview")
def overview(
    season: str = Query("All"),
    start_year: int | None = None,
    end_year: int | None = None,
    country: str = "All",
    sport: str = "All",
):
    df = _filtered(season, start_year, end_year, country, sport)
    medal_rows = df[df["medal"].str.casefold().isin(["gold", "silver", "bronze"])]
    years = sorted(df["year"].unique().tolist())
    return {
        "rows": int(len(df)),
        "athletes": _athlete_count(df),
        "countries": int(df["team"].replace("Unknown", np.nan).nunique()),
        "events": int(df[["year", "season", "event"]].drop_duplicates().shape[0]),
        "sports": int(df["sport"].nunique()),
        "medals": int(len(medal_rows)),
        "year_min": int(min(years)) if years else None,
        "year_max": int(max(years)) if years else None,
    }


@app.get("/api/gender")
def gender(
    season: str = Query("All"),
    start_year: int | None = None,
    end_year: int | None = None,
    country: str = "All",
    sport: str = "All",
):
    df = _filtered(season, start_year, end_year, country, sport)
    # Count unique athlete IDs per edition and sex where possible, avoiding
    # inflating counts because an athlete can enter several events.
    keys = ["year", "sex"]
    if df["id"].notna().any():
        grouped = df.dropna(subset=["id"]).groupby(keys)["id"].nunique().unstack(fill_value=0)
    else:
        grouped = df.groupby(keys)["name"].nunique().unstack(fill_value=0)
    for col in ["F", "M"]:
        if col not in grouped.columns:
            grouped[col] = 0
    grouped = grouped.reset_index().sort_values("year")
    total = grouped["F"] + grouped["M"]
    grouped["female_pct"] = np.where(total > 0, grouped["F"] / total * 100, 0).round(2)
    grouped["male_pct"] = np.where(total > 0, grouped["M"] / total * 100, 0).round(2)
    result = grouped.rename(columns={"F": "female_athletes", "M": "male_athletes"})
    return {"data": _safe_records(result[["year", "female_athletes", "male_athletes", "female_pct", "male_pct"]])}


@app.get("/api/seasons")
def seasons(
    start_year: int | None = None,
    end_year: int | None = None,
    country: str = "All",
    sport: str = "All",
):
    df = _filtered("All", start_year, end_year, country, sport)
    rows = []
    for season, group in df.groupby("season"):
        rows.append({
            "season": season,
            "athletes": _athlete_count(group),
            "countries": int(group["team"].replace("Unknown", np.nan).nunique()),
            "events": int(group[["year", "event"]].drop_duplicates().shape[0]),
            "editions": int(group["year"].nunique()),
            "medals": int(group["medal"].str.casefold().isin(["gold", "silver", "bronze"]).sum()),
        })
    return {"data": rows}


@app.get("/api/countries")
def countries(
    season: str = Query("All"),
    start_year: int | None = None,
    end_year: int | None = None,
    sport: str = "All",
    metric: str = Query("athletes", pattern="^(athletes|medals|gold|events)$"),
    limit: int = Query(15, ge=5, le=100),
):
    df = _filtered(season, start_year, end_year, "All", sport)
    medal_mask = df["medal"].str.casefold().isin(["gold", "silver", "bronze"])
    if metric == "athletes":
        if df["id"].notna().any():
            agg = df.groupby("team")["id"].nunique().rename("value")
        else:
            agg = df.groupby("team")["name"].nunique().rename("value")
    elif metric == "medals":
        agg = df[medal_mask].groupby("team").size().rename("value")
    elif metric == "gold":
        agg = df[df["medal"].str.casefold() == "gold"].groupby("team").size().rename("value")
    else:
        agg = df.groupby("team")["event"].nunique().rename("value")
    result = agg.sort_values(ascending=False).head(limit).reset_index()
    result = result.rename(columns={"team": "country"})
    return {"metric": metric, "data": _safe_records(result)}


@app.get("/api/country-trends")
def country_trends(
    season: str = Query("All"),
    country: str = Query("All"),
    metric: str = Query("medals", pattern="^(athletes|medals|gold)$"),
    start_year: int | None = None,
    end_year: int | None = None,
):
    df = _filtered(season, start_year, end_year, country, "All")
    if metric == "athletes":
        if df["id"].notna().any():
            result = df.groupby(["year", "team"])["id"].nunique().reset_index(name="value")
        else:
            result = df.groupby(["year", "team"])["name"].nunique().reset_index(name="value")
    else:
        medal = df["medal"].str.casefold()
        target = medal.isin(["gold", "silver", "bronze"]) if metric == "medals" else medal.eq("gold")
        result = df[target].groupby(["year", "team"]).size().reset_index(name="value")
    result = result.rename(columns={"team": "country"}).sort_values(["year", "country"])
    return {"metric": metric, "data": _safe_records(result)}


@app.get("/api/sports")
def sports(
    season: str = Query("All"),
    start_year: int | None = None,
    end_year: int | None = None,
):
    df = _filtered(season, start_year, end_year)
    result = df.groupby("sport").agg(
        rows=("event", "size"),
        events=("event", "nunique"),
        editions=("year", "nunique"),
    ).reset_index().sort_values("rows", ascending=False).head(25)
    return {"data": _safe_records(result)}


@app.get("/api/records")
def records(
    season: str = Query("All"),
    start_year: int | None = None,
    end_year: int | None = None,
    country: str = "All",
    sport: str = "All",
    limit: int = Query(100, ge=10, le=1000),
):
    df = _filtered(season, start_year, end_year, country, sport)
    cols = ["year", "season", "city", "sport", "event", "name", "sex", "age", "team", "medal"]
    result = df[cols].sort_values(["year", "sport", "event"]).head(limit)
    return {"data": _safe_records(result)}
