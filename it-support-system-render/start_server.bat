@echo off
chcp 65001 > nul
echo ===================================================
echo   ITTECH Bilisim - Teknik Destek ve Ariza Takip
echo   FastAPI Sunucusu Baslatiliyor...
echo ===================================================

:: Python yolunu dogrula
python --version > nul 2>&1
if errorlevel 1 (
    echo [HATA] Python bulunamadi! Lutfen Python'un PATH'e ekli oldugundan emin olun.
    pause
    exit /b 1
)

:: Tarayicida ac
start http://localhost:8000/
start http://localhost:8000/docs

:: Uvicorn sunucusunu calistir
echo Sunucu aktif: http://localhost:8000
echo Swagger Dokumantasyonu: http://localhost:8000/docs
echo Durdurmak icin CTRL + C basin.
echo ===================================================
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
