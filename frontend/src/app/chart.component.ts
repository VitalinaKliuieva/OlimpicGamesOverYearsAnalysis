import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: '<div #chart class="chart-canvas"></div>',
  styles: [':host{display:block;min-width:0}.chart-canvas{width:100%;height:330px}']
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() kind: 'line' | 'bar' | 'scatter' = 'bar';
  @Input() xKey = '';
  @Input() yKey = 'value';
  @Input() colorKey = '';
  @Input() title = '';
  @Input() xTitle = '';
  @Input() yTitle = '';
  @ViewChild('chart') chartRef!: ElementRef<HTMLDivElement>;
  private ready = false;

  ngAfterViewInit(): void {
    this.ready = true;
    this.draw();
  }
  ngOnChanges(_: SimpleChanges): void {
    if (this.ready) this.draw();
  }
  ngOnDestroy(): void {
    if (this.ready) Plotly.purge(this.chartRef.nativeElement);
  }

  private draw(): void {
    if (!this.chartRef || !this.data) return;
    const rows = this.data;
    const common = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, system-ui, sans-serif', color: '#dbe5f4', size: 11 },
      margin: { l: 48, r: 18, t: 24, b: 54 },
      xaxis: { title: { text: this.xTitle }, gridcolor: '#26354b', zerolinecolor: '#26354b', automargin: true },
      yaxis: { title: { text: this.yTitle }, gridcolor: '#26354b', zerolinecolor: '#26354b', automargin: true },
      legend: { orientation: 'h' as const, y: -0.25 },
      hoverlabel: { bgcolor: '#172337', font: { color: '#fff' } }
    };
    let traces: any[];
    if (this.colorKey) {
      const groups = [...new Set(rows.map(r => r[this.colorKey]))];
      traces = groups.map((group, i) => {
        const groupRows = rows.filter(r => r[this.colorKey] === group);
        return {
          x: groupRows.map(r => r[this.xKey]),
          y: groupRows.map(r => r[this.yKey]),
          type: this.kind === 'bar' ? 'bar' : 'scatter',
          mode: this.kind === 'line' ? 'lines+markers' : this.kind === 'scatter' ? 'markers' : undefined,
          name: String(group),
          marker: { size: 7 },
          line: { width: 2 }
        };
      });
    } else {
      traces = [{
        x: rows.map(r => r[this.xKey]),
        y: rows.map(r => r[this.yKey]),
        type: this.kind === 'bar' ? 'bar' : 'scatter',
        mode: this.kind === 'line' ? 'lines+markers' : this.kind === 'scatter' ? 'markers' : undefined,
        marker: { size: 7 },
        line: { width: 2 },
        hovertemplate: '%{x}<br>%{y:,}<extra></extra>'
      }];
    }
    Plotly.react(this.chartRef.nativeElement, traces, common, {
      responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d']
    });
  }
}
