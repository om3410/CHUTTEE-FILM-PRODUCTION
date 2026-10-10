# ============================================================
# Chuttee Backend - Full Endpoint Tester
# ============================================================
$BASE = "http://127.0.0.1:8000"
$USERNAME = "chuttee"
$PASSWORD = "chuttee2024"

Write-Host "`n=== Step 1: Getting JWT token ===" -ForegroundColor Cyan

$loginBody = @{
    username = $USERNAME
    password = $PASSWORD
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE/api/token/" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $response.access
    Write-Host "Token obtained" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$H = @{ Authorization = "Bearer $TOKEN" }

$ENDPOINTS = @(
    "/admin/",
    "/swagger/",
    "/redoc/",
    "/api/auth/me/",
    "/api/production/projects/",
    "/api/production/crew/",
    "/api/production/cast/",
    "/api/production/scenes/",
    "/api/production/budget/",
    "/api/production/festivals/",
    "/api/production/risks/",
    "/api/production/shoot-days/",
    "/api/production/equipment/",
    "/api/analytics/budget/",
    "/api/analytics/daily-burn-rate/",
    "/api/analytics/budget-summary/",
    "/api/analytics/risk-matrix/",
    "/api/analytics/festival-status/",
    "/api/analytics/upcoming-festivals/",
    "/api/ml/forecast/budget/",
    "/api/ml/ai/budget-anomalies/",
    "/api/ml/ai/risk-forecast/",
    "/api/ml/ai/daily-insights/",
    "/api/exports/csv/crew/",
    "/api/exports/excel/",
    "/api/collaboration/comments/",
    "/api/collaboration/audit-logs/",
    "/api/security/2fa/setup/",
    "/api/billing/plans/"
)

Write-Host "`n=== Testing $($ENDPOINTS.Count) endpoints ===" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

foreach ($url in $ENDPOINTS) {
    try {
        $r = Invoke-WebRequest -Uri "$BASE$url" -Headers $H -Method GET -ErrorAction Stop -UseBasicParsing
        Write-Host "PASS $($r.StatusCode)  $url" -ForegroundColor Green
        $pass++
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "FAIL $code  $url" -ForegroundColor Red
        $fail++
    }
}

Write-Host ""
Write-Host "=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $pass" -ForegroundColor Green
Write-Host "Failed: $fail" -ForegroundColor Red
Write-Host "Total:  $($ENDPOINTS.Count)"