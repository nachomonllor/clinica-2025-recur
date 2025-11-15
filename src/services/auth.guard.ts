
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';


export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  const session = await auth.getSession();
  if (!session) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

