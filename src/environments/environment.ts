
export const environment = {
  production: false,
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseKey: 'TU-ANON-KEY',
  captchaEnabled: true,
  quickLogins: {
    paciente:     { email: 'paciente@test.com',     password: 'Paciente123' },
    especialista: { email: 'especialista@test.com', password: 'Especialista123' },
    admin:        { email: 'admin@test.com',        password: 'Admin123' }
  }
};






// export const environment = {
//   production: false,
//   supabase: {
//     url: 'https://TU-PROYECTO.supabase.co',
//     anonKey: 'TU-ANON-KEY'
//   },
//   captchaEnabled: true,
//   quickLogins: {
//     paciente:     { email: 'paciente@test.com',     password: 'Paciente123' },
//     especialista: { email: 'especialista@test.com', password: 'Especialista123' },
//     admin:        { email: 'admin@test.com',        password: 'Admin123' }
//   }
// };



// export const environment = {
//   production: false,
//   supabaseUrl: 'https://TU_PROYECTO.supabase.co',
//   supabaseKey: 'TU_API_KEY_PUBLICA'
// };

