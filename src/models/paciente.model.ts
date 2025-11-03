
// src/app/models/paciente.model.ts
export interface Paciente {
  id: string;             // <-- campo para identificarlo
  avatarUrl: string;      // <-- para la imagen en la lista

  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obraSocial: string;
  email: string;
  password: string;
  //  manejar los archivos directamente como File:
  // imagenPerfil1: File;
  //imagenPerfil2: File;
  // Si prefieres trabajar con URLs/base64:
  imagenPerfil1: string;
  imagenPerfil2: string;
}

// export interface Paciente {
//   id: string;
//   avatarUrl: string;
//   nombre: string;
//   apellido: string;
//   edad: number;
//   dni: string;
//   obraSocial: string;
//   email?: string;      // opcional
//   password?: string;   // opcional
//   imagenPerfil1: string;
//   imagenPerfil2: string;
// }




/*
■ Nombre
■ Apellido
■ Edad
■ DNI
■ Obra Social
■ Mail
■ Contraseña
■ 2 imágenes para su perfil.
○ Para los Especialistas los datos serán:
■ Nombre
■ Apellido
■ Edad
■ DNI
■ Especialidad
● En este caso se le deberá dar la posibilidad de elegir o agregar alguna que no se
encuentre entre las posibilidades
■ Mail
■ Contraseña
■ Imagen de perfil
○ Debemos validar los campos según corresponda.
*/


// export interface PacienteRegistro {
//   nombre: string;
//   apellido: string;
//   edad: number;
//   dni: string;
//   obraSocial: string;
//   email: string;
//   password: string;
//   imagenPerfil1: File;
//   imagenPerfil2: File;
// }

// export interface Paciente extends PacienteRegistro {
//   id: string;
//   avatarUrl: string;
// }



