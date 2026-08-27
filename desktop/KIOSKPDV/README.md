# Menfis KIOSKPDV

Aplicativo Windows enxuto que abre o deploy Menfis com `?kiosk=1` e fornece
impressão térmica nativa e silenciosa à interface web. Não inclui PCC 930,
backend local, ERP ou KDS.

## Gerar instalador

```powershell
npm install
npm test
npm run build
```

Saída: `dist/Menfis-KIOSKPDV-Setup-1.2.0.exe`.

O perfil de desempenho pré-aquece rede e cache, mantém a GPU ativa e reduz
animações e desfoques apenas dentro do executável. O deploy aberto no navegador
permanece visualmente inalterado.

Impressora padrão: `POS-58`. Para usar outro nome, defina `MENFIS_PRINTER`.
Fechamento técnico: `Ctrl+Shift+Q`.
