# API Employees (Express.js)

## Requisitos
- Node 18+ recomendado
- Postman para probar la colección

## Instalación
```bash
npm i
npm start

Variables usadas en Postman: 
{{baseUrl}}, {{token}}, {{postId}}

Flujo:
Register → Login → CRUD Posts (con token) y Employees sin auth

Registro devuelve activationUrl para confirmar cuenta.
El avatar se sirve desde /uploads/… y su URL aparece como avatarUrl.