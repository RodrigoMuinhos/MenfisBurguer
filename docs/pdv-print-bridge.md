# Ponte de impressão dos PDVs

A impressão direta não depende do Electron. O fluxo padrão em todas as estações é:

```text
Web app Menfis
  → http://127.0.0.1:17777/print
  → Ponte de Impressão Menfis
  → spooler RAW do Windows
  → POS-58
```

O navegador não possui permissão para acessar diretamente o spooler do Windows. Por
isso, cada máquina PDV que imprime precisa executar a ponte local.

## Instalação em cada PDV

Pré-requisitos:

- Windows;
- impressora instalada com o nome `POS-58`;
- Node.js disponível no `PATH`.

Abra o PowerShell na raiz do projeto e execute:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install-print-bridge.ps1
```

O instalador:

1. copia a ponte para `%LOCALAPPDATA%\MenfisPrintBridge`;
2. cria inicialização automática no perfil do Windows;
3. inicia o processo oculto;
4. valida `http://127.0.0.1:17777/health`.

O resultado esperado é:

```text
MENFIS_PRINT_BRIDGE_READY printer=POS-58
```

## Diagnóstico

```powershell
Invoke-RestMethod http://127.0.0.1:17777/health
Get-Printer -Name POS-58
Get-NetTCPConnection -LocalPort 17777 -State Listen
```

A ponte aceita impressão apenas das origens oficiais `menfisburguer.com.br` e dos
endereços locais de desenvolvimento. Ela escuta somente em `127.0.0.1`, portanto
não fica exposta à rede do estabelecimento.
