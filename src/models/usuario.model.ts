interface Usuario {
    nombre: string;
    apellido: string;
    email: string;
    imagenPerfil: string;
    // Si el usuario es Especialista, puede tener horarios asignados.
    horarios?: Horario[];
  }
  
  