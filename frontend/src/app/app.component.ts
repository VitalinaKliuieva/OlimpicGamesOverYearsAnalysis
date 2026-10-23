import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService, Filters, Metadata, Overview } from './api.service';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComponent],
  template: `
  <div class="shell">

    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">O</div>
        <div>
          <strong>OLYMPIC</strong>
          <span>DATA STUDIO</span>
        </div>
      </div>

      <div class="side-label">WORKSPACE</div>

      <button
        class="nav-item"
        [class.active]="activeView === 'overview'"
        (click)="setView('overview')">
        <span>◫</span> Overview
      </button>

      <button
        class="nav-item"
        [class.active]="activeView === 'participation'"
        (click)="setView('participation')">
        <span>↗</span> Participation
      </button>

      <button
        class="nav-item"
        [class.active]="activeView === 'countries'"
        (click)="setView('countries')">
        <span>◎</span> Countries &amp; medals
      </button>

      <button
        class="nav-item"
        [class.active]="activeView === 'sports'"
        (click)="setView('sports')">
        <span>▤</span> Events &amp; sports
      </button>

      <div class="sidebar-bottom">
        <div class="live-dot"></div>
        <span>Local analytics workspace</span>
      </div>
    </aside>


    <main class="main">
      <header class="topbar">
        <div><div class="eyebrow">SPORTS INTELLIGENCE / HISTORICAL DATA</div><h1>Olympic Games analytics</h1></div>
        <div class="header-right"><span class="source-pill">1896 — 2016</span><span class="avatar">OA</span></div>
      </header>

      <section class="filters panel">
        <div class="filter-heading"><div><strong>Explore the data</strong><span>Adjust dimensions to update the dashboard</span></div><button class="reset-btn" (click)="resetFilters()">Reset filters ↺</button></div>
        <div class="filter-grid">
          <label>GAMES SEASON
            <select [(ngModel)]="filters.season" (ngModelChange)="refresh()">
              <option value="All">Summer + Winter</option><option *ngFor="let s of (meta?.seasons || [])" [value]="s">{{s}}</option>
            </select>
          </label>
          <label>START YEAR
            <select [(ngModel)]="filters.start_year" (ngModelChange)="refresh()">
              <option [ngValue]="null">All years</option><option *ngFor="let y of years" [ngValue]="y">{{y}}</option>
            </select>
          </label>
          <label>END YEAR
            <select [(ngModel)]="filters.end_year" (ngModelChange)="refresh()">
              <option [ngValue]="null">All years</option><option *ngFor="let y of years" [ngValue]="y">{{y}}</option>
            </select>
          </label>
          <label>COUNTRY / TEAM
            <select [(ngModel)]="filters.country" (ngModelChange)="refresh()">
              <option value="All">All countries</option><option *ngFor="let c of (meta?.countries || [])" [value]="c">{{c}}</option>
            </select>
          </label>
          <label>SPORT
            <select [(ngModel)]="filters.sport" (ngModelChange)="refresh()">
              <option value="All">All sports</option><option *ngFor="let s of (meta?.sports || [])" [value]="s">{{s}}</option>
            </select>
          </label>
        </div>
        <div class="filter-note" *ngIf="filters.start_year && filters.end_year && filters.start_year > filters.end_year">
          Start year is after end year. Choose a valid year range.
        </div>
      </section>

      <div class="error panel" *ngIf="error"><strong>Could not load analytics</strong><p>{{error}}</p><span>Check that the Python API is running and your CSV is in backend/data/.</span></div>
      <div class="loading" *ngIf="loading">Updating dashboard…</div>

      @switch(activeView) {
          @case('overview'){
              <section class="kpi-grid" *ngIf="overview">
                <article class="kpi panel"><div class="kpi-top"><span>ATHLETES</span><span class="kpi-icon">♙</span></div><strong>{{overview.athletes | number}}</strong><small>Unique athletes in selection</small></article>
                <article class="kpi panel"><div class="kpi-top"><span>COUNTRIES / TEAMS</span><span class="kpi-icon">⌖</span></div><strong>{{overview.countries | number}}</strong><small>Represented in selected data</small></article>
                <article class="kpi panel"><div class="kpi-top"><span>EVENT-YEARS</span><span class="kpi-icon">◷</span></div><strong>{{overview.events | number}}</strong><small>Distinct events across editions</small></article>
                <article class="kpi panel"><div class="kpi-top"><span>MEDAL ROWS</span><span class="kpi-icon">✧</span></div><strong>{{overview.medals | number}}</strong><small>Gold, silver and bronze records</small></article>
              </section>
          }
          @case('participation'){
              <section class="section-heading"><div><div class="eyebrow">01 / PARTICIPATION</div><h2>Who gets to compete?</h2></div><p>Track the evolution of athlete participation and gender representation.</p></section>
               <section class="chart-grid">
                    <article class="panel chart-panel wide"><div class="chart-head"><div><h3>Female participation over time</h3><p>Share of unique athletes by edition</p></div><span class="chart-tag">GENDER EQUITY</span></div>
                        <app-chart [data]="genderData" kind="line" xKey="year" yKey="female_pct" title="Female athlete share" xTitle="Year" yTitle="Female athletes (%)"></app-chart>
                    </article>
                    <article class="panel chart-panel"><div class="chart-head"><div><h3>Summer vs Winter</h3><p>Participation and event scale</p></div></div>
                        <app-chart [data]="seasonData" kind="bar" xKey="season" yKey="athletes" title="Season comparison" xTitle="Season" yTitle="Unique athletes"></app-chart>
                            <div class="mini-stats"><div *ngFor="let s of seasonData"><span>{{s.season}} events</span><strong>{{s.events | number}}</strong></div></div>
                    </article>
               </section>
          }
          @case('countries'){<section class="section-heading"><div><div class="eyebrow">02 / COUNTRY PERFORMANCE</div><h2>Participation vs achievement</h2></div><p>Change the metric to compare countries and inspect their historical trajectories.</p></section>
              <section class="panel chart-panel">
                <div class="chart-head responsive-head"><div><h3>Top countries</h3><p>Ranked by the selected measure</p></div>
                  <label class="inline-filter">RANKING METRIC
                    <select [(ngModel)]="countryMetric" (ngModelChange)="refreshCountryCharts()">
                      <option value="athletes">Athletes</option><option value="medals">Total medals</option><option value="gold">Gold medals</option><option value="events">Unique events</option>
                    </select>
                  </label>
                </div>
                <app-chart [data]="countryData" kind="bar" xKey="country" yKey="value" title="Country ranking" xTitle="Country / team" yTitle="Selected metric"></app-chart>
              </section>
              <section class="panel chart-panel trend-panel">
                <div class="chart-head responsive-head"><div><h3>Country trends over time</h3><p>One selected country, across Olympic editions</p></div>
                  <div class="inline-filters">
                    <label class="inline-filter">COUNTRY
                      <select [(ngModel)]="trendCountry" (ngModelChange)="refreshTrend()">
                        <option value="United States">United States</option><option *ngFor="let c of (meta?.countries || [])" [value]="c">{{c}}</option>
                      </select>
                    </label>
                    <label class="inline-filter">MEASURE
                      <select [(ngModel)]="trendMetric" (ngModelChange)="refreshTrend()">
                        <option value="medals">Total medals</option><option value="gold">Gold medals</option><option value="athletes">Athletes</option>
                      </select>
                    </label>
                  </div>
                </div>
                <app-chart [data]="trendData" kind="line" xKey="year" yKey="value" title="Historical trend" xTitle="Year" yTitle="Selected measure"></app-chart>
              </section>
          }
          @case('sports'){
              <section class="section-heading"><div><div class="eyebrow">03 / SPORT LANDSCAPE</div><h2>Events across disciplines</h2></div><p>Discover which sports have the broadest event footprint in the selected scope.</p></section>
              <section class="panel chart-panel">
                <div class="chart-head"><div><h3>Sports with the most events</h3><p>Distinct event names within the filtered selection</p></div></div>
                <app-chart [data]="sportsData" kind="bar" xKey="sport" yKey="events" title="Events by sport" xTitle="Sport" yTitle="Unique events"></app-chart>
              </section>
          }
      }
      <footer>OLYMPIC DATA STUDIO <span>Exploratory analysis · Source: user-provided Olympic dataset</span></footer>
    </main>
  </div>
  `,
  styles: [`
  :host{display:block;min-height:100vh;color:#eaf0fa}
  .shell{min-height:100vh}.sidebar{position:fixed;inset:0 auto 0 0;width:226px;background:#0a1220;border-right:1px solid #1c2a3d;padding:27px 16px;display:flex;flex-direction:column;z-index:5}
  .brand{display:flex;gap:11px;align-items:center;padding:0 10px 42px}.brand-mark{width:37px;height:37px;border-radius:12px;background:#e4ff73;color:#111a22;display:grid;place-items:center;font-weight:900;font-size:22px}.brand strong{display:block;font-size:13px;letter-spacing:1.8px}.brand span{display:block;color:#72829b;font-size:9px;letter-spacing:2.2px;margin-top:4px}
  .side-label{font-size:9px;letter-spacing:1.8px;color:#63728a;padding:0 12px 12px}.nav-item{padding:12px;border-radius:9px;color:#94a3b8;font-size:12px;margin-bottom:5px;display:flex;gap:12px;align-items:center}.nav-item span{font-size:16px}.nav-item.active{background:#1a2939;color:#e8ff82;border:1px solid #2c3b4a}.sidebar-bottom{margin-top:auto;border-top:1px solid #1b293b;padding:18px 8px 0;display:flex;gap:8px;align-items:center;color:#75849a;font-size:10px}.live-dot{width:7px;height:7px;border-radius:50%;background:#9be56d}
  .main{margin-left:226px;max-width:1600px;padding:30px 34px 22px}.topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:25px}.eyebrow{font-size:9px;color:#a8c05b;letter-spacing:1.8px;font-weight:700}.topbar h1{font-size:25px;margin:8px 0 0;letter-spacing:-.7px}.header-right{display:flex;align-items:center;gap:12px}.source-pill{border:1px solid #344257;border-radius:20px;padding:7px 12px;color:#b8c4d5;font-size:10px}.avatar{width:32px;height:32px;border-radius:50%;background:#243247;display:grid;place-items:center;font-size:10px;color:#dffb7b}
  .panel{background:#111d2d;border:1px solid #25364b;border-radius:13px;box-shadow:0 8px 24px #03091420}.filters{padding:18px 20px;margin-bottom:20px}.filter-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.filter-heading strong{display:block;font-size:13px}.filter-heading span{display:block;color:#8190a5;font-size:10px;margin-top:5px}.reset-btn{background:transparent;border:1px solid #34455b;color:#b8c5d6;border-radius:7px;padding:8px 10px;font-size:10px;cursor:pointer}.filter-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.filter-grid label,.inline-filter{display:flex;flex-direction:column;gap:7px;color:#8292a9;font-size:9px;letter-spacing:1px;font-weight:700;min-width:0}select{width:100%;min-width:0;background:#0b1625;color:#dce6f4;border:1px solid #2b3b50;border-radius:7px;padding:10px 9px;font-size:11px;outline:none}select:focus{border-color:#c8e96c}.filter-note{color:#ffbf75;font-size:11px;margin-top:10px}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:20px 0 32px}.kpi{padding:17px 18px}.kpi-top{display:flex;justify-content:space-between;align-items:center;color:#91a0b4;font-size:9px;letter-spacing:1.1px;font-weight:700}.kpi-icon{font-size:17px;color:#cce975}.kpi>strong{display:block;font-size:29px;letter-spacing:-1px;margin:12px 0 5px}.kpi small{font-size:10px;color:#8190a5}
  .section-heading{display:flex;justify-content:space-between;align-items:end;margin:32px 1px 15px;gap:20px}.section-heading h2{font-size:19px;margin:6px 0 0;letter-spacing:-.5px}.section-heading p{font-size:10px;color:#8190a5;max-width:330px;text-align:right;line-height:1.6;margin:0}.chart-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:14px}.chart-panel{padding:18px 18px 12px;min-width:0}.chart-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.chart-head h3{font-size:13px;margin:0}.chart-head p{font-size:10px;color:#8190a5;margin:6px 0 0}.chart-tag{font-size:8px;letter-spacing:1px;color:#d9f38a;border:1px solid #425039;background:#202d29;padding:6px 8px;border-radius:5px;white-space:nowrap}.mini-stats{display:flex;gap:12px;padding:2px 6px 10px}.mini-stats div{flex:1;border-top:1px solid #26364a;padding-top:10px}.mini-stats span{display:block;font-size:9px;color:#8493a8}.mini-stats strong{display:block;font-size:15px;margin-top:4px}.responsive-head{align-items:center}.inline-filter{font-size:8px;min-width:145px}.inline-filter select{padding:8px}.inline-filters{display:flex;gap:10px}.trend-panel{margin-top:14px}.error{padding:18px;margin:18px 0;border-color:#75464a}.error p{color:#ffb3b3;font-size:12px}.error span{color:#9eabba;font-size:11px}.loading{font-size:11px;color:#d9f38a;margin:10px 0}footer{display:flex;justify-content:space-between;color:#66778e;font-size:8px;letter-spacing:1.2px;margin:30px 2px 0}footer span{letter-spacing:0;font-size:9px}
  @media(max-width:1150px){.sidebar{width:185px}.main{margin-left:185px;padding:24px 20px}.filter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.chart-grid{grid-template-columns:1fr}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:700px){.sidebar{position:static;width:auto;height:auto;padding:14px;display:block}.brand{padding:0}.side-label,.nav-item,.sidebar-bottom{display:none}.main{margin:0;padding:18px 12px}.topbar{align-items:flex-start}.topbar h1{font-size:20px}.header-right{gap:6px}.source-pill{display:none}.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi-grid{gap:8px}.kpi{padding:13px}.kpi>strong{font-size:23px}.section-heading{align-items:flex-start;flex-direction:column}.section-heading p{text-align:left}.responsive-head{align-items:flex-start;flex-direction:column}.inline-filters{width:100%}.inline-filter{flex:1;min-width:0}footer{gap:12px;flex-direction:column}}
  `]
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  meta: Metadata | null = null;
  overview: Overview | null = null;
  years: number[] = [];
  filters: Filters = { season: 'All', start_year: null, end_year: null, country: 'All', sport: 'All' };
  countryMetric = 'athletes';
  trendMetric = 'medals';
  trendCountry = 'United States';
  genderData: any[] = [];
  seasonData: any[] = [];
  countryData: any[] = [];
  trendData: any[] = [];
  sportsData: any[] = [];
  error = '';
  loading = false;

  activeView:
  | 'overview'
  | 'participation'
  | 'countries'
  | 'sports' = 'overview';

    setView(view: typeof this.activeView): void {
      this.activeView = view;
    }

  ngOnInit(): void {
    this.api.metadata().subscribe({
      next: meta => {
        this.meta = meta;
        this.years = [...meta.years].sort((a, b) => a - b);
        if (meta.countries.includes('United States')) this.trendCountry = 'United States';
        else this.trendCountry = meta.countries[0] || 'All';
        this.refresh();
      },
      error: err => this.error = this.message(err)
    });
  }

  resetFilters(): void {
    this.filters = { season: 'All', start_year: null, end_year: null, country: 'All', sport: 'All' };
    this.refresh();
  }

  refresh(): void {
    if (this.filters.start_year && this.filters.end_year && this.filters.start_year > this.filters.end_year) return;
    this.loading = true;
    this.error = '';
    forkJoin({
      overview: this.api.overview(this.filters),
      gender: this.api.gender(this.filters),
      seasons: this.api.seasons(this.filters),
      sports: this.api.sports(this.filters)
    }).subscribe({
      next: result => {
        this.overview = result.overview;
        this.genderData = result.gender.data;
        this.seasonData = result.seasons.data;
        this.sportsData = result.sports.data;
        this.loading = false;
        this.refreshCountryCharts();
        this.refreshTrend();
      },
      error: err => { this.error = this.message(err); this.loading = false; }
    });
  }

  refreshCountryCharts(): void {
    this.api.countries(this.filters, this.countryMetric).subscribe({
      next: result => this.countryData = result.data,
      error: err => this.error = this.message(err)
    });
  }

  refreshTrend(): void {
    const filters = { ...this.filters, country: this.trendCountry, sport: 'All' };
    this.api.countryTrends(filters, this.trendMetric).subscribe({
      next: result => this.trendData = result.data,
      error: err => this.error = this.message(err)
    });
  }

  private message(err: any): string {
    return err?.error?.detail || err?.message || 'Unknown error. Check the API and CSV dataset.';
  }
}
