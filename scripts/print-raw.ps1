param(
  [Parameter(Mandatory = $true)]
  [string]$PrinterName
)

$ErrorActionPreference = "Stop"
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class MenfisRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public class DOC_INFO_1 {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }

  [DllImport("winspool.Drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern bool OpenPrinter(string printerName, out IntPtr printer, IntPtr defaults);
  [DllImport("winspool.Drv", SetLastError = true)] public static extern bool ClosePrinter(IntPtr printer);
  [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern int StartDocPrinter(IntPtr printer, int level, [In] DOC_INFO_1 docInfo);
  [DllImport("winspool.Drv", SetLastError = true)] public static extern bool EndDocPrinter(IntPtr printer);
  [DllImport("winspool.Drv", SetLastError = true)] public static extern bool StartPagePrinter(IntPtr printer);
  [DllImport("winspool.Drv", SetLastError = true)] public static extern bool EndPagePrinter(IntPtr printer);
  [DllImport("winspool.Drv", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr printer, byte[] bytes, int count, out int written);
}
"@

$content = [Console]::In.ReadToEnd()
$encoding = [System.Text.Encoding]::GetEncoding(850)
$bytes = $encoding.GetBytes("`e@" + $content)
$printerHandle = [IntPtr]::Zero

if (-not [MenfisRawPrinter]::OpenPrinter($PrinterName, [ref]$printerHandle, [IntPtr]::Zero)) {
  throw "Nao foi possivel abrir a impressora $PrinterName (Win32: $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
}

try {
  $docInfo = [MenfisRawPrinter+DOC_INFO_1]::new()
  $docInfo.pDocName = "Nota Menfis"
  $docInfo.pDataType = "RAW"
  if ([MenfisRawPrinter]::StartDocPrinter($printerHandle, 1, $docInfo) -le 0) {
    throw "StartDocPrinter falhou (Win32: $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
  }
  try {
    if (-not [MenfisRawPrinter]::StartPagePrinter($printerHandle)) {
      throw "StartPagePrinter falhou (Win32: $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
    }
    try {
      $written = 0
      if (-not [MenfisRawPrinter]::WritePrinter($printerHandle, $bytes, $bytes.Length, [ref]$written) -or $written -ne $bytes.Length) {
        throw "WritePrinter incompleto: $written de $($bytes.Length) bytes"
      }
      Write-Output "RAW_OK bytes=$written columns=32"
    } finally {
      [void][MenfisRawPrinter]::EndPagePrinter($printerHandle)
    }
  } finally {
    [void][MenfisRawPrinter]::EndDocPrinter($printerHandle)
  }
} finally {
  [void][MenfisRawPrinter]::ClosePrinter($printerHandle)
}
