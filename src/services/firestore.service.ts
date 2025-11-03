// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { Paciente } from '../models/paciente.model';

// @Injectable({ providedIn: 'root' })
// export class FirestoreService {
//   private pacientesCollection: AngularFirestoreCollection<Paciente>;

//   constructor(private afs: AngularFirestore) {
//     // Inicializa la colección 'pacientes'
//     this.pacientesCollection = this.afs.collection<Paciente>('pacientes');
//   }

//   /**
//    * Obtiene un Observable con la lista de pacientes, incluyendo el campo 'id'.
//    */
//   getPacientes(): Observable<Paciente[]> {
//     return this.pacientesCollection.valueChanges({ idField: 'id' });
//   }

//   /**
//    * Crea un nuevo paciente en Firestore.
//    */
//   addPaciente(pacienteData: any): Promise<any> {
//     return this.pacientesCollection.add(pacienteData);
//   }

//   /**
//    * Actualiza un paciente existente identificándolo por su ID.
//    */
//   updatePaciente(id: string, updateData: any): Promise<void> {
//     return this.pacientesCollection.doc(id).update(updateData);
//   }
// }



// // // src/app/firestore.service.ts
// // import { Injectable } from '@angular/core';
// // import {
// //   Firestore,
// //   collection,
// //   addDoc,
// //   doc,
// //   updateDoc,
// //   DocumentReference
// // } from '@angular/fire/firestore';

// // @Injectable({ providedIn: 'root' })
// // export class FirestoreService {
// //   constructor(private firestore: Firestore) {}

// //   addPaciente(pacienteData: any): Promise<DocumentReference> {
// //     const pacientesCol = collection(this.firestore, 'pacientes');
// //     return addDoc(pacientesCol, pacienteData);
// //   }

// //   updatePaciente(id: string, updateData: any): Promise<void> {
// //     const pacienteRef = doc(this.firestore, 'pacientes', id);
// //     return updateDoc(pacienteRef, updateData);
// //   }

// // }




// // // src/app/firestore.service.ts
// // import { Injectable } from '@angular/core';
// // import {
// //   Firestore,
// //   collection,
// //   addDoc,
// //   doc,
// //   updateDoc,
// //   DocumentReference
// // } from '@angular/fire/firestore';
// // import { Paciente } from './models/paciente.model';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class FirestoreService {
// //   constructor(private firestore: Firestore) {}

// //   /**
// //    * Crea un nuevo paciente en la colección 'pacientes'.
// //    * @param pacienteData Objeto con los campos del paciente (sin id).
// //    * @returns Promise con la referencia al documento creado.
// //    */
// //   addPaciente(pacienteData: any): Promise<DocumentReference> {
// //     const pacientesCol = collection(this.firestore, 'pacientes');
// //     return addDoc(pacientesCol, pacienteData);
// //   }

// //   /**
// //    * Actualiza un paciente existente.
// //    * @param id ID del documento a actualizar.
// //    * @param updateData Campos a modificar.
// //    * @returns Promise<void>
// //    */
// //   updatePaciente(id: string, updateData: any): Promise<void> {
// //     const pacienteRef = doc(this.firestore, 'pacientes', id);
// //     return updateDoc(pacienteRef, updateData);
// //   }
// // }



// // // src/app/firestore.service.ts
// // import { Injectable } from '@angular/core';
// // import {
// //   Firestore,
// //   collection,
// //   addDoc,
// //   doc,
// //   updateDoc,
// //   CollectionReference
// // } from '@angular/fire/firestore';
// // import { Paciente } from './models/paciente.model';

// // @Injectable({ providedIn: 'root' })
// // export class FirestoreService {
// //   private pacientesColl: CollectionReference<Omit<Paciente, 'id'>>;

// //   constructor(private firestore: Firestore) {
// //     // Ahora sí firestore ya está inicializado
// //     this.pacientesColl = collection(
// //       this.firestore,
// //       'pacientes'
// //     ) as CollectionReference<Omit<Paciente, 'id'>>;
// //   }

// //   addPaciente(data: Omit<Paciente, 'id'>) {
// //     return addDoc(this.pacientesColl, data);
// //   }

// //   updatePaciente(id: string, data: Partial<Paciente>) {
// //     const pacienteRef = doc(this.firestore, 'pacientes', id);
// //     return updateDoc(pacienteRef, data);
// //   }
// // }




// // import { Injectable } from '@angular/core';
// // import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
// // import { Observable } from 'rxjs';
// // import { Paciente } from './models/paciente.model';
// // import { Especialista } from './models/especialista.model';

// // //export interface Paciente { nombre: string; apellido: string; edad: number; dni: string; /*…*/ }
// // //export interface Especialista { nombre: string; apellido: string; edad: number; dni: string; especialidad: string; email: string; /*…*/ }

// // @Injectable({ providedIn: 'root' })
// // export class FirestoreService {
// //   constructor(private fs: Firestore) {}

// //   // PACIENTES
// //   getPacientes(): Observable<Paciente[]> {
// //     const col = collection(this.fs, 'pacientes');
// //     return collectionData(col, { idField: 'id' }) as Observable<Paciente[]>;
// //   }
// //   addPaciente(p: Paciente) {
// //     const col = collection(this.fs, 'pacientes');
// //     return addDoc(col, p);
// //   }

// //   // ESPECIALISTAS
// //   getEspecialistas(): Observable<Especialista[]> {
// //     const col = collection(this.fs, 'especialistas');
// //     return collectionData(col, { idField: 'id' }) as Observable<Especialista[]>;
// //   }
// //   addEspecialista(e: Especialista) {
// //     const col = collection(this.fs, 'especialistas');
// //     return addDoc(col, e);
// //   }

// //   // agregar métodos update/delete  
// // }
