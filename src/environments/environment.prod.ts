

export const environment = {
  production: true,
  supabaseUrl: ' https://tuwlrspqlkpqatnaintx.supabase.co',             
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA',
  captchaEnabled: true,
  quickLogins: {
    paciente:     { email: 'paciente@test.com',     password: 'Paciente123' },
    especialista: { email: 'especialista@test.com', password: 'Especialista123' },
    admin:        { email: 'admin@test.com',        password: 'Admin123' }
  }
};
