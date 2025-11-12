import { trigger, transition, style, animate, query, group } from '@angular/animations';

const optional = { optional: true };

const basePositions = [
  query(':enter, :leave', [
    style({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    })
  ], optional)
];

const slideLeft = [
  ...basePositions,
  query(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 })
  ], optional),
  query(':leave', [
    style({ transform: 'translateX(0)', opacity: 1 })
  ], optional),
  group([
    query(':leave', [
      animate('350ms cubic-bezier(.25,.8,.25,1)', style({ transform: 'translateX(-30%)', opacity: 0 }))
    ], optional),
    query(':enter', [
      animate('350ms cubic-bezier(.25,.8,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
    ], optional)
  ])
];

const slideRight = [
  ...basePositions,
  query(':enter', [
    style({ transform: 'translateX(-100%)', opacity: 0 })
  ], optional),
  query(':leave', [
    style({ transform: 'translateX(0)', opacity: 1 })
  ], optional),
  group([
    query(':leave', [
      animate('320ms cubic-bezier(.25,.8,.25,1)', style({ transform: 'translateX(40%)', opacity: 0 }))
    ], optional),
    query(':enter', [
      animate('320ms cubic-bezier(.25,.8,.25,1)', style({ transform: 'translateX(0)', opacity: 1 }))
    ], optional)
  ])
];

const fadeZoom = [
  ...basePositions,
  query(':enter', [
    style({ opacity: 0, transform: 'scale(0.96) translateY(12px)' })
  ], optional),
  query(':leave', [
    style({ opacity: 1, transform: 'scale(1) translateY(0)' })
  ], optional),
  group([
    query(':leave', [
      animate('240ms ease-out', style({ opacity: 0, transform: 'scale(0.98) translateY(-8px)' }))
    ], optional),
    query(':enter', [
      animate('320ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
    ], optional)
  ])
];

const defaultSlide = [
  ...basePositions,
  query(':enter', [
    style({ transform: 'translateY(12px)', opacity: 0 })
  ], optional),
  group([
    query(':leave', [
      animate('260ms ease-out', style({ transform: 'translateY(-12px)', opacity: 0 }))
    ], optional),
    query(':enter', [
      animate('260ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
    ], optional)
  ])
];

export const slideInAnimation = trigger('routeAnimations', [
  transition('login => estadisticas', slideLeft),
  transition('estadisticas => login', slideRight),
  transition('estadisticas => miPerfil', fadeZoom),
  transition('miPerfil => estadisticas', fadeZoom),
  transition('* <=> *', defaultSlide)
]);

export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const scaleInAnimation = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.9)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

