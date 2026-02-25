

export const environment = {
  production: true,

  supabaseUrl: 'https://tuwlrspqlkpqatnaintx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA',
  
  //supabaseUrl: 'https://dbcocmlssxqnqoxrxqnr.supabase.co',
  //supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiY29jbWxzc3hxbnFveHJ4cW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NDI2MjgsImV4cCI6MjA4NjUxODYyOH0.BrdoWAg4e-FcuQywtkIYCBAG845LoXthiZCpUXQFdYs',
  


  captchaEnabled: true,
  recaptchaSiteKey: 'SITE_KEY_DEL_CAPTCHA_ACA',


  quickLogins: {
    paciente: [
      {
        email: 'ana@hotmail.com',
        password: '123456',
        nombre: 'ana moron',
        avatar: ''
      },
      {
        email: 'augusto@hotmail.com',
        password: '123456',
        nombre: 'augusto morelli',
        avatar: ''
      },

      {
        email: 'axl@hotmail.com',
        password: '123456',
        nombre: 'axl rose',
        avatar: ''
      },

    ],

    especialista: [
      {
        email: 'alberto@hotmail.com',
        password: '123456',
        nombre: 'alberto einstein',
        avatar: ''
      },
      {
        email: 'nora@hotmail.com',
        password: '123456',
        nombre: 'Nora Da Puente',
        avatar: ''
      },

    ],

    admin: [
      {
        email: 'till@hotmail.com',
        password: '123456',
        nombre: 'till lindemann',
        avatar: ''
      },

    ]
  }


};
