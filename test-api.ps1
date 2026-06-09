Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Power BI Portal API Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Build project
Write-Host "1. Building backend solution..." -ForegroundColor Yellow
dotnet build backend\PowerBILearning.slnx
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build succeeded!" -ForegroundColor Green

# 2. Run API in background
Write-Host "2. Starting C# API in background..." -ForegroundColor Yellow
$apiProcess = Start-Process dotnet -ArgumentList "run --project backend\src\4.WebApi\PowerBILearning.WebApi.csproj" -PassThru -WindowStyle Hidden

# Wait for API to start
Write-Host "Waiting for API to initialize (port 5194)..."
$started = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $test = Invoke-RestMethod -Uri "http://localhost:5194/api/lectures" -Method Get -TimeoutSec 1
        $started = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $started) {
    Write-Host "Failed to start API!" -ForegroundColor Red
    Stop-Process -Id $apiProcess.Id -Force
    exit 1
}
Write-Host "API started successfully!" -ForegroundColor Green

# 3. Test GET Lectures
Write-Host "`n3. Testing GET /api/lectures..." -ForegroundColor Yellow
try {
    $lectures = Invoke-RestMethod -Uri "http://localhost:5194/api/lectures" -Method Get
    Write-Host "Found $($lectures.Count) lectures in database:" -ForegroundColor Green
    foreach ($l in $lectures) {
        Write-Host "  - [$($l.lectureNumber)] $($l.title) (Status: $($l.status))"
    }
    
    if ($lectures.Count -eq 8) {
        Write-Host "GET Lectures test PASSED!" -ForegroundColor Green
    } else {
        Write-Host "GET Lectures test FAILED! Expected 8 lectures." -ForegroundColor Red
    }
    
    $targetLectureId = $lectures[0].id
} catch {
    Write-Host "GET Lectures test failed with exception: $_" -ForegroundColor Red
}

# 4. Test PUT Status
Write-Host "`n4. Testing PUT /api/lectures/$targetLectureId/status..." -ForegroundColor Yellow
try {
    $body = @{ status = 1 } | ConvertTo-Json # Status: Reading (1)
    $response = Invoke-RestMethod -Uri "http://localhost:5194/api/lectures/$targetLectureId/status" -Method Put -Body $body -ContentType "application/json"
    Write-Host "Response: $($response.message)" -ForegroundColor Green
    Write-Host "PUT Status test PASSED!" -ForegroundColor Green
} catch {
    Write-Host "PUT Status test FAILED with exception: $_" -ForegroundColor Red
}

# 5. Test POST Notes
Write-Host "`n5. Testing POST /api/lectures/$targetLectureId/notes..." -ForegroundColor Yellow
try {
    $body = @{ content = "This is a test note created by integration script." } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:5194/api/lectures/$targetLectureId/notes" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Response: $($response.message)" -ForegroundColor Green
    Write-Host "POST Notes test PASSED!" -ForegroundColor Green
} catch {
    Write-Host "POST Notes test FAILED with exception: $_" -ForegroundColor Red
}

# 6. Clean up
Write-Host "`n6. Cleaning up..." -ForegroundColor Yellow
Stop-Process -Id $apiProcess.Id -Force
Write-Host "API Process stopped." -ForegroundColor Green
Write-Host "Tests complete!" -ForegroundColor Cyan
