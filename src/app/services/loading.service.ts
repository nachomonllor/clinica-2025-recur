
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private counter = 0;
  private readonly _isLoading$ = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this._isLoading$.asObservable();

  show(): void {
    this.counter++;
    if (this.counter === 1) this._isLoading$.next(true);
  }

  hide(): void {
    if (this.counter > 0) this.counter--;
    if (this.counter === 0) this._isLoading$.next(false);
  }
}




// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class LoadingService {

//   constructor() { }
// }
