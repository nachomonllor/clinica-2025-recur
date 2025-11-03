

import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
@Pipe({ name: 'localDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  transform(value: any, format: string = 'mediumDate', tz?: string|null) {
    const lang = localStorage.getItem('lang') || 'es';
    const loc = lang==='en' ? 'en-US' : (lang==='pt' ? 'pt-BR' : 'es-AR');
    try { return formatDate(value, format, loc, tz || undefined); } catch { return ''; }
  }
}


