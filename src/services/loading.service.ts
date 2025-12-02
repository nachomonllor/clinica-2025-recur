import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Un BehaviorSubject mantiene el estado actual (true/false)
  public isLoading$ = new BehaviorSubject<boolean>(false);

  constructor() { }

  show() {
    this.isLoading$.next(true);
  }

  hide() {
    this.isLoading$.next(false);
  }
}





// // src/services/loading.service.ts
// import { Injectable } from '@angular/core';
// import { BehaviorSubject, Observable } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class LoadingService {
//   private counter = 0;

//   private readonly _loading$ = new BehaviorSubject<boolean>(false);
//   /** Observable público */
//   readonly loading$: Observable<boolean> = this._loading$.asObservable();

//   /** Alias para que el componente pueda usar isLoading$ */
//   readonly isLoading$ = this.loading$;

//   show(): void {
//     this.counter++;
//     if (this.counter === 1) {
//       this._loading$.next(true);
//     }
//   }

//   hide(): void {
//     if (this.counter > 0) {
//       this.counter--;
//       if (this.counter === 0) {
//         this._loading$.next(false);
//       }
//     }
//   }

//   reset(): void {
//     this.counter = 0;
//     this._loading$.next(false);
//   }
// }

