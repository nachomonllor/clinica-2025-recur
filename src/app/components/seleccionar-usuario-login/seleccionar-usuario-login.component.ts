import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
    selector: 'app-seleccionar-usuario-login',
    standalone:true,
    imports: [
        CommonModule,
        MatCardModule, // ya lo usas en registro-paciente :contentReference[oaicite:0]{index=0}
        MatButtonModule // idem :contentReference[oaicite:1]{index=1}
    ],
    templateUrl: './seleccionar-usuario-login.component.html',
    styleUrl: './seleccionar-usuario-login.component.scss'
})

export class SeleccionarUsuarioLoginComponent {
  constructor(public router: Router) {}
}