# Kosora App - School Examination & OMR System

A comprehensive SaaS platform for Rwandan schools featuring AI-powered exam generation, OMR scanning, and student performance tracking.

## Architecture

```
kosora-app/
├── client/          # React frontend (Vite + Tailwind CSS)
├── server/          # Node.js/Express backend (MySQL)
├── scanner/         # Python OMR scanner (OpenCV + Tesseract)
└── database/        # MySQL schema
```

## Prerequisites

- Node.js 18+
- MySQL 8+
- Python 3.9+
- Ollama (for AI exam generation)
- Tesseract OCR (for scanner)
- OpenCV

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Server

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

### 3. Frontend Client

```bash
cd client
npm install
npm run dev
```

### 4. Python Scanner Service

```bash
cd scanner
pip install -r requirements.txt
# Install Tesseract OCR: https://github.com/tesseract-ocr/tesseract
python server.py
```

### 5. Ollama (AI Exam Generation)

```bash
# Install Ollama: https://ollama.ai
ollama pull llama3
# Ollama runs on http://localhost:11434 by default
```

## User Roles

| Role | Description |
|------|-------------|
| Super Admin | Register schools, manage system-wide settings |
| Admin | Manage school users, students, generate report cards |
| Teacher | Upload materials, generate exams, scan OMR, view results |
| Student | View personal results and performance |

## Features

- **Multi-tenant SaaS**: Super admin registers schools, each school has isolated data
- **Learning Materials**: Upload PDF, DOCX, TXT with automatic text extraction
- **AI Exam Generation**: Generate MCQ questions from uploaded materials using Ollama
- **Exam Editor**: Review, edit, and add questions manually
- **PDF Generation**: Download printable exam papers and OMR answer sheets
- **OMR Scanning**: Upload scanned answer sheets or capture via webcam
- **Auto-Grading**: Python service detects filled bubbles, compares with answer key
- **Analytics**: Charts for student performance, class averages, subject analytics
- **Report Cards**: Generate term report cards for all students
- **Offline Support**: Service Worker + IndexedDB for offline caching

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Super Admin
- `POST /api/schools` - Register new school
- `GET /api/schools` - List all schools

### School Admin
- `POST /api/students` - Add student
- `GET /api/school/classes` - List classes
- `POST /api/school/subjects` - Add subject
- `POST /api/reports/report-card` - Generate report card

### Teacher
- `POST /api/materials` - Upload material
- `POST /api/exams` - Create exam
- `POST /api/exams/:id/generate-questions` - AI generate questions
- `GET /api/exams/:id/pdf/download` - Download exam PDF
- `GET /api/exams/:id/omr/download` - Download OMR sheet
- `POST /api/scanner/:examId/process` - Process OMR scan

### Reports
- `GET /api/reports/class-results` - Get class results
- `GET /api/reports/student/:id/performance` - Student performance
- `GET /api/reports/dashboard` - Dashboard stats

## Environment Variables

### Server (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kosora_db
JWT_SECRET=change_this_in_production
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
PYTHON_SCANNER_URL=http://localhost:5001
```

## Default Credentials

After creating a school via the super admin, create test users:

- Admin: admin@school.com / password
- Teacher: teacher@school.com / password
- Student: student@school.com / student123

## Development

```bash
# Run all services
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev

# Terminal 3: Scanner
cd scanner && python server.py

# Terminal 4: Ollama (if not running as service)
ollama serve
```

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Chart.js, React Router, Axios, LocalForage
- **Backend**: Node.js, Express, MySQL2, JWT, Multer, PDFKit, PDF-Parse, Mammoth
- **Scanner**: Python, Flask, OpenCV, NumPy, Tesseract OCR
- **AI**: Ollama (local LLM)

## License

MIT
