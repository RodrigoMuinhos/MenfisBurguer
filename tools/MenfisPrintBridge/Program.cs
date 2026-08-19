using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32;

namespace MenfisPrintBridge;

internal static class Program
{
    private const string PrinterName = "POS-58";
    private const string RunValueName = "MenfisPrintBridge";
    private const string ProtocolName = "menfis-print-bridge";
    private static readonly string InstallDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "MenfisPrintBridge");
    private static readonly string InstalledExecutable = Path.Combine(InstallDirectory, "MenfisPrintBridge.exe");
    private static readonly HashSet<string> AllowedOrigins = new(StringComparer.OrdinalIgnoreCase)
    {
        "https://menfisburguer.com.br",
        "https://www.menfisburguer.com.br",
        "http://localhost:3000",
        "http://localhost:3100"
    };

    [STAThread]
    private static async Task Main(string[] args)
    {
        if (args.Contains("--run", StringComparer.OrdinalIgnoreCase)
            || args.Any(argument => argument.StartsWith($"{ProtocolName}://", StringComparison.OrdinalIgnoreCase)))
        {
            await RunBridge();
            return;
        }

        var silentInstall = args.Contains("--install-silent", StringComparer.OrdinalIgnoreCase);
        var testPrint = args.Contains("--test-print", StringComparer.OrdinalIgnoreCase);
        ApplicationConfiguration.Initialize();
        try
        {
            Install();
            var ready = await WaitForHealth();
            if (!ready)
            {
                if (silentInstall)
                {
                    Environment.ExitCode = 2;
                    return;
                }
                MessageBox.Show(
                    "A Ponte de Impressão Menfis foi instalada, mas não respondeu na porta 17777.",
                    "Menfis Print Bridge",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            if (silentInstall)
            {
                if (testPrint)
                {
                    RawPrinter.Print(PrinterName,
                        "MENFI'S BURGER\nTESTE INSTALADOR PDV\nPOS-58 CONECTADA\n=======================\nIMPRESSAO DIRETA OK\n\n\n");
                }
                return;
            }

            var test = MessageBox.Show(
                "Ponte instalada e POS-58 encontrada. Deseja imprimir uma nota curta de teste agora?",
                "Menfis Print Bridge",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Information);
            if (test == DialogResult.Yes)
            {
                RawPrinter.Print(PrinterName,
                    "MENFI'S BURGER\n" +
                    "TESTE PONTE PDV\n" +
                    "POS-58 CONECTADA\n" +
                    "=======================\n" +
                    "IMPRESSAO DIRETA OK\n\n\n");
                MessageBox.Show(
                    "Teste enviado com sucesso. O ERP e o kiosk já podem imprimir diretamente.",
                    "Menfis Print Bridge",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }
        catch (Exception exception)
        {
            MessageBox.Show(
                $"Não foi possível instalar a ponte de impressão.\n\n{exception.Message}",
                "Menfis Print Bridge",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static void Install()
    {
        if (!RawPrinter.Exists(PrinterName))
        {
            throw new InvalidOperationException($"A impressora '{PrinterName}' não está instalada no Windows.");
        }

        Directory.CreateDirectory(InstallDirectory);
        var currentExecutable = Environment.ProcessPath
            ?? throw new InvalidOperationException("Não foi possível localizar o instalador.");
        if (!Path.GetFullPath(currentExecutable).Equals(Path.GetFullPath(InstalledExecutable), StringComparison.OrdinalIgnoreCase))
        {
            File.Copy(currentExecutable, InstalledExecutable, overwrite: true);
        }

        using var runKey = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run");
        runKey?.SetValue(RunValueName, $"\"{InstalledExecutable}\" --run", RegistryValueKind.String);

        using var protocolKey = Registry.CurrentUser.CreateSubKey($@"Software\Classes\{ProtocolName}");
        protocolKey?.SetValue(null, "URL:Menfis Print Bridge Protocol", RegistryValueKind.String);
        protocolKey?.SetValue("URL Protocol", "", RegistryValueKind.String);
        using var commandKey = protocolKey?.CreateSubKey(@"shell\open\command");
        commandKey?.SetValue(null, $"\"{InstalledExecutable}\" \"%1\"", RegistryValueKind.String);

        var running = Process.GetProcessesByName("MenfisPrintBridge")
            .Any(process => process.Id != Environment.ProcessId);
        if (!running)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = InstalledExecutable,
                Arguments = "--run",
                UseShellExecute = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                WorkingDirectory = InstallDirectory
            });
        }
    }

    private static async Task<bool> WaitForHealth()
    {
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        for (var attempt = 0; attempt < 20; attempt++)
        {
            try
            {
                using var response = await client.GetAsync("http://127.0.0.1:17777/health");
                if (response.IsSuccessStatusCode) return true;
            }
            catch
            {
                // Aguarda o processo instalado iniciar.
            }
            await Task.Delay(250);
        }
        return false;
    }

    private static async Task RunBridge()
    {
        using var mutex = new Mutex(initiallyOwned: true, "Local\\MenfisPrintBridge-17777", out var ownsMutex);
        if (!ownsMutex) return;

        var builder = WebApplication.CreateSlimBuilder();
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:17777");
        var app = builder.Build();

        app.Use(async (context, next) =>
        {
            var origin = context.Request.Headers.Origin.ToString();
            if (!string.IsNullOrWhiteSpace(origin) && AllowedOrigins.Contains(origin))
            {
                context.Response.Headers.AccessControlAllowOrigin = origin;
                context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
                context.Response.Headers.Vary = "Origin";
            }
            await next();
        });

        app.MapGet("/health", () => Results.Ok(new { ok = true, printer = PrinterName }));
        app.MapMethods("/health", new[] { "OPTIONS" }, (HttpContext context) =>
        {
            var origin = context.Request.Headers.Origin.ToString();
            if (!AllowedOrigins.Contains(origin)) return Results.StatusCode(403);
            context.Response.Headers.AccessControlAllowMethods = "GET, OPTIONS";
            context.Response.Headers.AccessControlAllowHeaders = "Content-Type";
            context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
            context.Response.Headers.AccessControlMaxAge = "86400";
            return Results.NoContent();
        });
        app.MapMethods("/print", new[] { "OPTIONS" }, (HttpContext context) =>
        {
            var origin = context.Request.Headers.Origin.ToString();
            if (!AllowedOrigins.Contains(origin)) return Results.StatusCode(403);
            context.Response.Headers.AccessControlAllowMethods = "POST, OPTIONS";
            context.Response.Headers.AccessControlAllowHeaders = "Content-Type";
            context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
            context.Response.Headers.AccessControlMaxAge = "86400";
            return Results.NoContent();
        });
        app.MapPost("/print", (HttpContext context, PrintRequest request) =>
        {
            var origin = context.Request.Headers.Origin.ToString();
            if (!AllowedOrigins.Contains(origin)) return Results.StatusCode(403);
            if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > 100_000)
                return Results.BadRequest(new { ok = false, error = "invalid_content" });

            var longestLine = request.Content.Replace("\r", "").Split('\n').Max(line => line.Length);
            if (longestLine > 32)
                return Results.BadRequest(new { ok = false, error = "receipt_too_wide", longestLine });

            try
            {
                var bytes = RawPrinter.Print(PrinterName, request.Content + "\r\n\r\n\r\n");
                return Results.Ok(new { ok = true, transport = "RAW", printer = PrinterName, bytes, longestLine });
            }
            catch (Exception exception)
            {
                return Results.Json(new { ok = false, error = exception.Message }, statusCode: 503);
            }
        });

        await app.RunAsync();
        GC.KeepAlive(mutex);
    }

    private sealed record PrintRequest(string? Type, string? Printer, string? OrderId, string Content);
}

internal static class RawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private sealed class DocInfo
    {
        [MarshalAs(UnmanagedType.LPWStr)] public string DocumentName = "Nota Menfis";
        [MarshalAs(UnmanagedType.LPWStr)] public string? OutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string DataType = "RAW";
    }

    [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool OpenPrinter(string printerName, out IntPtr printer, IntPtr defaults);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool ClosePrinter(IntPtr printer);
    [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern int StartDocPrinter(IntPtr printer, int level, [In] DocInfo documentInfo);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndDocPrinter(IntPtr printer);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool StartPagePrinter(IntPtr printer);
    [DllImport("winspool.drv", SetLastError = true)] private static extern bool EndPagePrinter(IntPtr printer);
    [DllImport("winspool.drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr printer, byte[] bytes, int count, out int written);

    internal static bool Exists(string printerName)
    {
        if (!OpenPrinter(printerName, out var printer, IntPtr.Zero)) return false;
        ClosePrinter(printer);
        return true;
    }

    internal static int Print(string printerName, string content)
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
        var encoding = Encoding.GetEncoding(850);
        var contentBytes = encoding.GetBytes(content);
        var bytes = new byte[contentBytes.Length + 2];
        bytes[0] = 27;
        bytes[1] = 64;
        Buffer.BlockCopy(contentBytes, 0, bytes, 2, contentBytes.Length);

        if (!OpenPrinter(printerName, out var printer, IntPtr.Zero))
            throw Win32("Não foi possível abrir a POS-58");
        try
        {
            if (StartDocPrinter(printer, 1, new DocInfo()) <= 0) throw Win32("StartDocPrinter falhou");
            try
            {
                if (!StartPagePrinter(printer)) throw Win32("StartPagePrinter falhou");
                try
                {
                    if (!WritePrinter(printer, bytes, bytes.Length, out var written) || written != bytes.Length)
                        throw Win32($"WritePrinter incompleto: {written} de {bytes.Length} bytes");
                    return written;
                }
                finally { EndPagePrinter(printer); }
            }
            finally { EndDocPrinter(printer); }
        }
        finally { ClosePrinter(printer); }
    }

    private static Exception Win32(string message) =>
        new InvalidOperationException($"{message} (Win32: {Marshal.GetLastWin32Error()})");
}
