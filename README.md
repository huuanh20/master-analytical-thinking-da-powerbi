# Power BI Course Learning Portal

A premium, modern, dark-mode workspace for studying Master Analytical Thinking & Data Analysis with Power BI.

This project features:
- **Backend**: C# ASP.NET Core Web API following **Clean Architecture & SOLID principles**, running an in-memory SQLite database that automatically seeds course PDFs.
- **Frontend**: React + Vite + TypeScript Single Page Application with a **Feature-Based structure** and modern **glassmorphic design**, complete with progress tracking, PDF viewer, and debounced notes autosave.

---

## System Architecture

```mermaid
graph TD
    subgraph Frontend [React Single Page App - Vercel]
        UI[User Interface] --> Store[Zustand State Store]
        Store --> API_Client[Axios API Client]
        UI --> PDF[PDF Viewer - Public Assets]
    end

    subgraph Backend [ASP.NET Core Web API - Render/Fly.io]
        API_Client -- HTTP Requests --> WebApi[Presentation Layer - WebApi]
        WebApi --> App[Application Layer - MediatR CQRS]
        App --> Infra[Infrastructure Layer - EF Core]
        Infra --> DB[(SQLite Database)]
    end
    
    style Frontend fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style Backend fill:#06202e,stroke:#0ea5e9,stroke-width:2px,color:#fff
```

---

## Project Structure

### Backend (C# Clean Architecture)
- **`1.Domain`**: Course Entities (`Lecture`, `Note`, `Progress`), Enums (`CourseStatus`), and Domain Exceptions.
- **`2.Application`**: Core business logic, MediatR Commands/Queries (CQRS), and database interface (`IApplicationDbContext`).
- **`3.Infrastructure`**: Persistence implementation (EF Core SQLite), database initialiser, and seeding data.
- **`4.WebApi`**: Entry point (`Program.cs`), Controllers/Endpoints, CORS policies, and AppSettings.

### Frontend (React + Vite Feature-Based)
- **`src/features/lectures`**: Lecture navigation list, status dropdown, search, and API connectors.
- **`src/features/notes`**: Rich text note taking and autosaving logic (debounced to backend).
- **`src/store`**: Global Zustand state store.
- **`src/components`**: Shared UI component library.
- **`src/services`**: Axios API endpoints configuration.

---

## How to Run Locally

### Prerequisites
- .NET SDK 9.0 or 10.0
- Node.js (v18+) and npm

### Step 1: Run C# Backend API
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Build and run the project:
   ```bash
   dotnet run --project src/4.WebApi/PowerBILearning.WebApi.csproj
   ```
3. The API will start and listen at `http://localhost:5194`.
   *(On first run, the SQLite database `PowerBILearning.db` will be automatically created and populated with the 8 default Power BI course lectures).*

### Step 2: Run React Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## How to Deploy

### 1. Frontend (React) to Vercel
Deploying to Vercel is extremely easy and free:
1. Push this repository to **GitHub**.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. In the Project Configuration:
   - Set **Root Directory** to `frontend`.
   - Vercel will automatically detect **Vite** and configure the build command (`npm run build`) and output directory (`dist`).
   - Add an Environment Variable:
     - Name: `VITE_API_URL`
     - Value: `https://your-backend-api-url.onrender.com` (Your deployed C# API URL).
5. Click **Deploy**.

### 2. Backend (C#) to Render.com / Fly.io
To host your C# API for free, you can use Render:
1. Create a `Dockerfile` in the `backend/` directory to containerize the ASP.NET Core API.
2. Push to GitHub.
3. In the Render Dashboard, click **New > Web Service**.
4. Select your repository.
5. In the configurations:
   - Set the build run command to Docker.
   - Render will build your Docker image and expose the API endpoint.
   - Configure a persistent disk if you want the SQLite file to survive deployments, or connect to a free PostgreSQL database (updating the ConnectionString in `appsettings.json` to PostgreSQL).
