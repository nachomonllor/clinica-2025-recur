// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));


// main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

//  Configuración nueva de la app
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    // NGX-TRANSLATE v17 (standalone)
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',   // donde pusiste es.json, en.json, pt.json
        suffix: '.json'
      }),
      // idioma inicial y fallback
      fallbackLang: 'es',
      lang: 'es'
    })
  ]
};

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
