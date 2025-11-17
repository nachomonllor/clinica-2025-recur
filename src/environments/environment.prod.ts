

export const environment = {
  production: true,
  supabaseUrl: 'https://tuwlrspqlkpqatnaintx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA',
  captchaEnabled: true,
    recaptchaSiteKey: 'SITE_KEY_DEL_CAPTCHA_ACA',

  quickLogins: {
    paciente: [
      { email: 'paciente@test.com', password: 'Paciente123', nombre: 'Paciente Demo', avatar: 'assets/avatars/james.jpg' },
      { email: 'marcela.rodriguez@test.com', password: 'Paciente123', nombre: 'Marcela Rodríguez', avatar: 'assets/avatars/indio.jpg' },
      { email: 'andres.lopez@test.com', password: 'Paciente123', nombre: 'Andrés López', avatar: 'assets/avatars/jagger.jpg' }
    ],
    especialista: [
      { email: 'especialista@test.com', password: 'Especialista123', nombre: 'Dra. Ana Ruiz', avatar: 'assets/avatars/avril.jpg' },
      { email: 'jorge.perez@test.com', password: 'Especialista123', nombre: 'Dr. Jorge Pérez', avatar: 'assets/avatars/albert.jpg' }
    ],
    admin: [
      { email: 'admin@test.com', password: 'Admin123', nombre: 'Administrador Demo', avatar: 'assets/avatars/nacho.jpg' }
    ]
  }
};
