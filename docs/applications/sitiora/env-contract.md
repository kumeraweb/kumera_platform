# Sitiora - Env Contract

Last updated: 2026-03-05

App: `apps/sitiora-web`

## 1) Requeridas en produccion (Vercel)

1. `RESEND_API_KEY`
   - Scope: server
   - Uso: envio de correo interno + auto-reply en `POST /api/contact`
2. `CONTACT_INBOX_EMAIL`
   - Scope: server
   - Uso: inbox comercial destino de leads
3. `CONTACT_FROM_EMAIL`
   - Scope: server
   - Uso: remitente de correo interno
4. `AUTOREPLY_FROM_EMAIL`
   - Scope: server
   - Uso: remitente de auto-reply al lead
5. `CONTACT_REPLY_TO_EMAIL`
   - Scope: server
   - Uso: reply-to del auto-reply
6. `ALLOWED_ORIGINS`
   - Scope: server
   - Uso: validacion de origen permitido para `/api/contact`
7. `CONTACT_RATE_LIMIT_MAX`
   - Scope: server
   - Uso: limite de intentos por ventana
8. `CONTACT_RATE_LIMIT_WINDOW_SEC`
   - Scope: server
   - Uso: ventana de rate limit en segundos

Estado verificado con Vercel (sitiora-web): todas presentes.

## 2) Opcionales (recomendadas)

1. `PUBLIC_SITE_URL`
   - Scope: public/client
   - Uso: canonical base URL en paginas publicas
   - Default: `https://sitiora.kumeraweb.com`
2. `PUBLIC_GOOGLE_ADS_FORM_SEND_TO`
   - Scope: public/client
   - Uso: conversion Google Ads del formulario antes de redirigir a `/gracias`
   - Formato: `AW-17993579804/XXXXXXXXXXXX`
   - Default: vacio (si vacio, solo redirige sin evento de conversion form)
3. `PUBLIC_GOOGLE_ADS_ID`
   - Scope: public/client
   - Uso: helper de eventos en frontend
   - Default: `AW-17993579804`

## 3) Legacy/no usadas actualmente

1. `PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL`
   - Estado: no usada en runtime actual (WhatsApp usa `gtag_report_conversion` hardcodeado)
2. `PUBLIC_GOOGLE_ADS_FORM_LABEL`
   - Estado: no usada en runtime actual

## 4) Regla operativa

1. Toda variable nueva debe:
   - agregarse en `apps/sitiora-web/.env.example`
   - documentarse aqui (`env-contract.md`)
   - quedar reflejada en `apps/sitiora-web/README.md`
2. Toda variable en Vercel sin uso en codigo debe marcarse como `legacy` o eliminarse.
