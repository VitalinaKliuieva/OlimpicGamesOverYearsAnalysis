import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Filters {
  season?: string;
  start_year?: number | null;
  end_year?: number | null;
  country?: string;
  sport?: string;
  metric?: string;
  limit?: number;
}
export interface Metadata {
  years: number[];
  seasons: string[];
  countries: string[];
  sports: string[];
  source_file: string;
  rows: number;
}
export interface Overview {
  rows: number;
  athletes: number;
  countries: number;
  events: number;
  sports: number;
  medals: number;
  year_min: number | null;
  year_max: number | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8000/api';

  private params(filters: Partial<Filters>): HttpParams {
      let params = new HttpParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 'All') {
          params = params.set(key, String(value));
        }
      });

      return params;
}

  metadata(): Observable<Metadata> {
    return this.http.get<Metadata>(`${this.base}/metadata`);
  }
  overview(filters: Filters): Observable<Overview> {
    return this.http.get<Overview>(`${this.base}/overview`, { params: this.params(filters) });
  }
  gender(filters: Filters): Observable<{data: any[]}> {
    return this.http.get<{data: any[]}>(`${this.base}/gender`, { params: this.params(filters) });
  }
  seasons(filters: Filters): Observable<{data: any[]}> {
    return this.http.get<{data: any[]}>(`${this.base}/seasons`, { params: this.params(filters) });
  }
  countries(filters: Filters, metric: string): Observable<{data: any[], metric: string}> {
    return this.http.get<{data: any[], metric: string}>(`${this.base}/countries`, {
      params: this.params({...filters, metric, limit: 15})
    });
  }
  countryTrends(filters: Filters, metric: string): Observable<{data: any[], metric: string}> {
    return this.http.get<{data: any[], metric: string}>(`${this.base}/country-trends`, {
      params: this.params({...filters, metric})
    });
  }
  sports(filters: Filters): Observable<{data: any[]}> {
    return this.http.get<{data: any[]}>(`${this.base}/sports`, { params: this.params(filters) });
  }
}
