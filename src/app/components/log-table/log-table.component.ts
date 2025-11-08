import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { LogEntry, LogService } from '../../services/log.service';

@Component({
    selector: 'app-log-table',
    standalone: true,
    imports: [CommonModule, HttpClientModule],
    templateUrl: './log-table.component.html',
    styleUrl: './log-table.component.scss'
})
export class LogTableComponent implements OnInit {
  logs: LogEntry[] = [];

  constructor(private logService: LogService) {}

  ngOnInit(): void {
    this.logService.getLoginLogs().subscribe(
      data => this.logs = data,
      err => console.error('Error cargando logs:', err)
    );
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-log-table',
//   standalone: true,
//   imports: [],
//   templateUrl: './log-table.component.html',
//   styleUrl: './log-table.component.scss'
// })
// export class LogTableComponent {

// }