# Mejora de fotos

Herramientas usadas para preparar las fotos del catálogo (no forman parte de la app).

- `sr.py` / `batch.py`: superresolución x4 con Real-ESRGAN (`realesrgan-x4plus`, versión ncnn) en CPU.
  Requiere `pip install ncnn pillow numpy` y los modelos de
  https://github.com/xinntao/Real-ESRGAN/releases (archivo `realesrgan-ncnn-vulkan-*-ubuntu.zip`, carpeta `models/`).
- `finalize.py`: fondo blanco uniforme, encuadre 4:5 (1000×1250) y recorte sin fondo.

Estado al 21-10-2026: originales mejorados parcialmente; referencias de preparada pendientes
(tienen fondo limpio, sin superresolución). Tarda ~1 minuto por foto en 2 núcleos.
