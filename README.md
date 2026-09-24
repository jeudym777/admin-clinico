# Historial Médico Dra. Oca (admin-clinico)

Sistema web para la gestión clínica, registro de pacientes, expedientes e historial médico completo con exportación en PDF y CSV.

## Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4
- **Enrutamiento:** React Router DOM v7
- **Manejo de Estado y Caché:** TanStack Query v5 (React Query)
- **Formularios:** React Hook Form
- **Base de Datos y Autenticación:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Generación de Reportes:** jsPDF & jspdf-autotable
- **Notificaciones:** React Toastify

## Instalación y Configuración

### 1. Clonar o descargar el repositorio
```bash
git clone https://github.com/jeudym777/admin-clinico.git
cd admin-clinico
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto tomando como referencia `.env.example`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 4. Base de Datos en Supabase
1. Accede a tu consola de [Supabase](https://supabase.com/).
2. Abre el **SQL Editor**.
3. Copia y ejecuta el contenido del archivo `supabase-schema.sql` (o `sample-db.sql`).
   - Esto creará las tablas `patients` y `clinical_records` con sus índices, restricciones de integridad y políticas RLS para usuarios autenticados.

### 5. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Funcionalidades del Sistema

1. **Autenticación:**
   - Inicio de sesión (`/login`) y registro (`/register`) con Supabase Auth.
   - Rutas protegidas mediante `ProtectedRoute`.

2. **Gestión de Pacientes (`/patients`):**
   - Listado con orden cronológico y búsqueda en tiempo real (por nombre o número de expediente).
   - Creación rápida de nuevo paciente con validación de duplicados.
   - Edición y eliminación con control de integridad referencial.
   - Exportación de catálogo completo a CSV y PDF.
   - Exportación de ficha individual de paciente a PDF.

3. **Historial Clínico y Consultas (`/patients/:id/records`):**
   - Resumen cronológico de consultas médicas por paciente.
   - Formulario clínico integral (`/patients/:id/records/new` y `/patients/:id/records/:recordId`):
     - Motivo de consulta y enfermedad actual.
     - Antecedentes personales patológicos (diabetes, HTA, cardio, alergias, etc.).
     - Antecedentes no patológicos (alimentación, actividad física, tabaco, alcohol, vacunas).
     - Gineco-obstétricos (menarca, FUM, ciclo, embarazos, partos, etc.).
     - Antecedentes familiares.
     - Revisión completa por aparatos y sistemas.
     - Signos vitales con cálculo automático de Índice de Masa Corporal (IMC).
     - Examen físico segmentado (cabeza/cuello, tórax, abdomen, extremidades, neurológico).
     - Estudios complementarios, diagnósticos, plan de tratamiento y observaciones.
   - Descarga en PDF de consulta individual y de historial clínico completo encadenado.
