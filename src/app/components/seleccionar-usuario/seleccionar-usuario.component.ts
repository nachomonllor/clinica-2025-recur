import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FavBienvenidaComponent } from "../fav-bienvenida/fav-bienvenida.component";

@Component({
    selector: 'app-seleccionar-usuario',
    standalone:true,
    imports: [
    CommonModule,
    MatCardModule, // ya lo usas en registro-paciente :contentReference[oaicite:0]{index=0}
    MatButtonModule // idem :contentReference[oaicite:1]{index=1}
    ,
    FavBienvenidaComponent
],
    templateUrl: './seleccionar-usuario.component.html',
    styleUrls: ['./seleccionar-usuario.component.scss']
})

export class SeleccionarUsuarioComponent {
  constructor(public router: Router) {}

  irAPaciente() {
    this.router.navigate(['/registro-paciente']);
  }

  irAEspecialista() {
    this.router.navigate(['/registro-especialista']);
  }
}


