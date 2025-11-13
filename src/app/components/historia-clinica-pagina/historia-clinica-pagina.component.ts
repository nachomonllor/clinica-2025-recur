// import { ChangeDetectionStrategy, Component } from '@angular/core';
// import { FormControl } from '@angular/forms';
// import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
// import { combineLatest, map, startWith, switchMap } from 'rxjs';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import { HistoriaClinica } from '../../../models/interfaces';
// import { HistoriaClinicaService } from '../../services/historia-clinica.service';
// import { CommonModule } from '@angular/common';
// import { MatIconModule } from "@angular/material/icon";
// import { MatFormFieldModule } from "@angular/material/form-field";
// import { MatSelectModule } from "@angular/material/select";

// type VM = {
//   pacienteNombre: string;
//   pacienteDni: string;
//   edadAnios: number | null;
//   especialidades: string[];
//   seleccionada: string | 'todas';
//   items: HistoriaClinica[];
// };

// @Component({
//   selector: 'app-historia-clinica-pagina',
//   standalone: true, 
//   imports: [CommonModule, MatIconModule, MatFormFieldModule, MatSelectModule],
//   templateUrl: './historia-clinica-pagina.component.html',
//   styleUrls: ['./historia-clinica-pagina.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class HistoriaClinicaPaginaComponent {
//   filtroEspecialidad = new FormControl<'todas' | string>('todas', { nonNullable: true });

//   vm$ = combineLatest({
//     id: this.route.paramMap.pipe(map(p => p.get('id') ?? 'paciente-1')),
//     sel: this.filtroEspecialidad.valueChanges.pipe(startWith('todas' as const))
//   }).pipe(
//     switchMap(({ id, sel }) =>
//       this.servicio.obtenerPorPacienteId(id).pipe(
//         map(list => {
//           const esp = Array.from(new Set(list.map(i => i.especialidad).filter(Boolean))) as string[];
//           const items = sel === 'todas' ? list : list.filter(i => i.especialidad === sel);

//           const ref = list[0];
//           const edadAnios = ref?.pacienteFechaNacimiento ? this.edad(ref.pacienteFechaNacimiento) : null;

//           return {
//             pacienteNombre: ref?.pacienteNombre ?? 'Paciente',
//             pacienteDni: ref?.pacienteDni ?? '',
//             edadAnios,
//             especialidades: ['todas', ...esp],
//             seleccionada: sel,
//             items: items.sort((a, b) => (a.fecha ?? '') < (b.fecha ?? '') ? 1 : -1)
//           } as VM;
//         })
//       )
//     )
//   );

//   constructor(private route: ActivatedRoute, private servicio: HistoriaClinicaService) {}

//   private edad(fechaIso: string): number {
//     const f = new Date(fechaIso);
//     const hoy = new Date();
//     let anios = hoy.getFullYear() - f.getFullYear();
//     const m = hoy.getMonth() - f.getMonth();
//     if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) anios--;
//     return anios;
//   }

//   async descargarPdf(): Promise<void> {
//     const el = document.getElementById('historyContent');
//     if (!el) return;
//     const canvas = await html2canvas(el, { scale: 2, useCORS: true });
//     const pdf = new jsPDF('p', 'mm', 'a4');
//     const w = pdf.internal.pageSize.getWidth();
//     const h = (canvas.height * w) / canvas.width;
//     pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, Math.min(h, 297), '', 'FAST');
//     pdf.save('historia-clinica.pdf');
//   }

//   trackById = (_: number, i: HistoriaClinica) => i.idConsulta ?? `${i.fecha}-${i.especialidad}-${i.presion}`;
// }



// ---------------------------------------

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-historia-clinica-pagina',
//   standalone: true,
//   imports: [],
//   templateUrl: './historia-clinica-pagina.component.html',
//   styleUrl: './historia-clinica-pagina.component.scss'
// })
// export class HistoriaClinicaPaginaComponent {
// }


