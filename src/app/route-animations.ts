import { trigger, transition, style, query, animate } from '@angular/animations';

export const fadeAnimation =
  trigger('routeAnimations', [
    transition('* <=> *', [
      // Buscamos la página nueva que está entrando (:enter)
      query(':enter', [
        // Empieza invisible
        style({ opacity: 0 }),
        // Se vuelve visible suavemente en 500ms
        animate('500ms ease-in-out', style({ opacity: 1 }))
      ], { optional: true }) // optional: true evita errores si no encuentra la página
    ])
  ]);


  
// // src/app/route-animations.ts
// import {
//   trigger,
//   transition,
//   style,
//   query,
//   group,
//   animate,
// } from '@angular/animations';

// export const slideInAnimation =
//   trigger('routeAnimations', [
//     transition('* <=> *', [
//       // Configuracion inicial del contenedor
//       style({ position: 'relative' }),
      
//       // Configuracion de las páginas (la que entra y la que sale)
//       query(':enter, :leave', [
//         style({
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%'
//         })
//       ], { optional: true }),

//       // Estado inicial de la página que entra (fuera de pantalla a la derecha)
//       query(':enter', [
//         style({ left: '100%' })
//       ], { optional: true }),

//       // Animacion en grupo (al mismo tiempo)
//       group([
//         // La que sale se va a la izquierda (-100%)
//         query(':leave', [
//           animate('300ms ease-out', style({ left: '-100%' }))
//         ], { optional: true }),
        
//         // La que entra se mueve al centro (0%)
//         query(':enter', [
//           animate('300ms ease-out', style({ left: '0%' }))
//         ], { optional: true }),
//       ]),
//     ]),
//   ]);

