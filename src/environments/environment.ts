
export const environment = {
  production: false,
  // Supabase Cloud (entorno por defecto)
  supabaseUrl: 'https://tuwlrspqlkpqatnaintx.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1d2xyc3BxbGtwcWF0bmFpbnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDcyOTEsImV4cCI6MjA3MTMyMzI5MX0.O5eawMd27SKifzyOvKp5fJZcvgBodxXA5LZWZdexRSA',
  // PARA volver a la instancia local, REEMPLAZAR estas variables por las de localhost.
  captchaEnabled: true,
  recaptchaSiteKey: 'SITE_KEY_DEL_CAPTCHA_ACA',

  quickLogins: {
    paciente: [
      {
        email: 'maradona@hotmail.com',
        password: '123456',
        nombre: 'diego maradona',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/7781eb7a-8c24-4631-a63c-4b9739c3e149/1763943378241_1_diego.jpg'
      },
      {
        email: 'ana@hotmail.com',
        password: '123456',
        nombre: 'ana moron',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/7c5fe838-8f24-451c-9fad-b8f957b231ff/1763891999915_1_antonela.jpg'
      },
      {
        email: 'augusto@hotmail.com',
        password: '123456',
        nombre: 'augusto morelli',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/af9064fc-ae3b-48ea-8229-aa2181d94fea/1763893808195_1_sanders.jpg'
      },

      {
        email: 'axl@hotmail.com',
        password: '123456',
        nombre: 'axl rose',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/2fc86fa1-eb8f-4f95-b011-8c0d4a1fa2cd/1763890730212_1_axl.jpg'
      },

    ],

    especialista: [

      {
        email: 'gustavo@hotmail.com',
        password: '123456',
        nombre: 'gustavo ceratti',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/bf9cdbf0-d13f-4c14-99a7-56997e2dd447/1763934863767_1_ceratti.jpg'
      },
      {
        email: 'alberto@hotmail.com',
        password: '123456',
        nombre: 'alberto einstein',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/57f31c41-37d5-4f6b-8e69-1132eb0453dc/1763889873282_1_albert.jpg'
      },
      {
        email: 'dexter@hotmail.com',
        password: '123456',
        nombre: 'dexter holland',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/73f3eb2a-9676-4c2b-9a2b-7b63d380c439/1764029033182_1_dexter_holland.jpg'
      },
      {
        email: 'isaac@hotmail.com',
        password: '123456',
        nombre: 'isaac newton',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/76548ca7-0287-48ce-8b6b-669a7fe33c18/1763930864652_1_indio.jpg'
      },
      {
        email: 'nora@hotmail.com',
        password: '123456',
        nombre: 'Nora Da Puente',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/35994f86-ef81-438f-b8f7-b27a35ea7902/1764020489484_1_julia.jpg'
      },
      {
        email: 'darwin@hotmail.com',
        password: '123456',
        nombre: 'charles darwin',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/86b2829d-2669-4ab9-b573-a7c9897d191e/1764046471863_1_darwin.jpg'
      },
      {
        email: 'tesla@hotmail.com',
        password: '123456',
        nombre: 'nicola tesla',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/da846dbf-6019-49b2-ad7e-a687af3ba856/1764043232033_1_tesla.jpg'
      },
      {
        email: 'galileo@hotmail.com',
        password: '123456',
        nombre: 'galileo galilei',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/96e33286-0f5d-4aca-8321-2f7f61ea367d/1764045087133_1_galileo.jpg'
      }
    ],

    admin: [
      {
        email: 'admin@hotmail.com',
        password: '123456',
        nombre: 'admin@hotmail.com',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/2173bce1-49f3-41f9-b600-990518322df2/1764039766395_1_admin.jpg'
      },
      {
        email: 'till@hotmail.com',
        password: '123456',
        nombre: 'till lindemann',
        avatar: 'https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/3748e513-4b59-41f6-8546-4fa11365e6b4/1764031310112_1_lindemann.jpg'
      },

    ]
  }


};


/*
[
  {
    "nombre": "admin@hotmail.com",
    "apellido": "admin",
    "email": "admin@hotmail.com",
    "perfil": "ADMIN",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/2173bce1-49f3-41f9-b600-990518322df2/1764039766395_1_admin.jpg"
  },
  {
    "nombre": "Admin",
    "apellido": "Principal",
    "email": "nachomonllor@hotmail.com",
    "perfil": "ADMIN",
    "imagen_perfil_1": null
  },
  {
    "nombre": "till",
    "apellido": "lindemann",
    "email": "till@hotmail.com",
    "perfil": "ADMIN",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/3748e513-4b59-41f6-8546-4fa11365e6b4/1764031310112_1_lindemann.jpg"
  },
  {
    "nombre": "Adrian",
    "apellido": "Apellido",
    "email": "adrian@hotmail.com",
    "perfil": "ADMIN",
    "imagen_perfil_1": null
  },
  {
    "nombre": "fernando",
    "apellido": "fernandez",
    "email": "fernando@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/a344c75f-074c-49ec-8471-110affc839a3/1763933182997_1_indio.jpg"
  },
  {
    "nombre": "gustavo",
    "apellido": "ceratti",
    "email": "gustavo@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/bf9cdbf0-d13f-4c14-99a7-56997e2dd447/1763934863767_1_ceratti.jpg"
  },
  {
    "nombre": "alberto",
    "apellido": "einstein",
    "email": "alberto@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/57f31c41-37d5-4f6b-8e69-1132eb0453dc/1763889873282_1_albert.jpg"
  },
  {
    "nombre": "dexter",
    "apellido": "holland",
    "email": "dexter@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/73f3eb2a-9676-4c2b-9a2b-7b63d380c439/1764029033182_1_dexter_holland.jpg"
  },
  {
    "nombre": "isaac ",
    "apellido": "newton",
    "email": "isaac@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/76548ca7-0287-48ce-8b6b-669a7fe33c18/1763930864652_1_indio.jpg"
  },
  {
    "nombre": "Nora",
    "apellido": "Da Puente",
    "email": "nora@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/35994f86-ef81-438f-b8f7-b27a35ea7902/1764020489484_1_julia.jpg"
  },
  {
    "nombre": "charles",
    "apellido": "darwin",
    "email": "darwin@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/86b2829d-2669-4ab9-b573-a7c9897d191e/1764046471863_1_darwin.jpg"
  },
  {
    "nombre": "nicola ",
    "apellido": "tesla",
    "email": "tesla@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/da846dbf-6019-49b2-ad7e-a687af3ba856/1764043232033_1_tesla.jpg"
  },
  {
    "nombre": "galileo",
    "apellido": "galilei",
    "email": "galileo@hotmail.com",
    "perfil": "ESPECIALISTA",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/96e33286-0f5d-4aca-8321-2f7f61ea367d/1764045087133_1_galileo.jpg"
  },
  {
    "nombre": "diego",
    "apellido": "maradona",
    "email": "maradona@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/7781eb7a-8c24-4631-a63c-4b9739c3e149/1763943378241_1_diego.jpg"
  },
  {
    "nombre": "gregorio",
    "apellido": "gregorio",
    "email": "gregorio@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/8be8b13c-d6bd-45ce-a686-3fd2bc9f5cce/1763891736059_1_dexter_holland.jpg"
  },
  {
    "nombre": "ana",
    "apellido": "moron",
    "email": "ana@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/7c5fe838-8f24-451c-9fad-b8f957b231ff/1763891999915_1_antonela.jpg"
  },
  {
    "nombre": "augusto",
    "apellido": "morelli",
    "email": "augusto@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/af9064fc-ae3b-48ea-8229-aa2181d94fea/1763893808195_1_sanders.jpg"
  },
  {
    "nombre": "ramona",
    "apellido": "valdez",
    "email": "ramona@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": null
  },
  {
    "nombre": "fernanda",
    "apellido": "fernandez",
    "email": "fernanda@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/60a5f80a-a33a-4480-8888-32a255a1c128/1764026330532_1_natalia.jpg"
  },
  {
    "nombre": "axl",
    "apellido": "rose",
    "email": "axl@hotmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": "https://tuwlrspqlkpqatnaintx.supabase.co/storage/v1/object/public/avatars/2fc86fa1-eb8f-4f95-b011-8c0d4a1fa2cd/1763890730212_1_axl.jpg"
  },
  {
    "nombre": "",
    "apellido": "",
    "email": "pepito@gmail.com",
    "perfil": "PACIENTE",
    "imagen_perfil_1": null
  }
]

*/