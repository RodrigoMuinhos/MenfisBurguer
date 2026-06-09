import { motion } from "motion/react";
import { ROSA, VERDE } from "@/utils/theme";
import { KioskKeyboardTarget } from "./checkout";

export function KioskVirtualKeyboard({
  target,
  onType,
  onBackspace,
  onClear,
  onClose,
}: {
  target: KioskKeyboardTarget;
  onType: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const qwertyRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];
  const alphaNumericRows =
    target === "coupon" ? [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], ...qwertyRows] : qwertyRows;
  const numericKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const buttonBase =
    "flex h-16 items-center justify-center rounded-2xl text-xl font-black uppercase shadow-sm active:scale-95";
  const secondaryButton = {
    background: "#F8F4F5",
    color: VERDE,
    border: `1.5px solid ${ROSA}`,
  };

  return (
    <motion.div
      initial={{ y: 280, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 280, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="sticky bottom-0 z-40 mt-4 px-3 pb-3 pt-4"
      style={{
        background: "rgba(255,255,255,0.98)",
        borderTop: `2px solid ${ROSA}`,
        boxShadow: "0 -18px 42px rgba(101,0,31,0.16)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: VERDE }}
          >
            {target === "phone"
              ? "Teclado numerico"
              : target === "coupon"
                ? "Teclado alfanumerico"
                : "Teclado QWERTY"}
          </p>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-3 text-xs font-black uppercase tracking-wider"
            style={{ background: VERDE, color: ROSA }}
          >
            Concluir
          </button>
        </div>

        {target === "phone" ? (
          <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
            {numericKeys.map((key) => (
              <button
                key={key}
                onClick={() => onType(key)}
                className={buttonBase}
                style={{ background: ROSA, color: VERDE }}
              >
                {key}
              </button>
            ))}
            <button
              onClick={onClear}
              className={buttonBase}
              style={secondaryButton}
            >
              Limpar
            </button>
            <button
              onClick={() => onType("0")}
              className={buttonBase}
              style={{ background: ROSA, color: VERDE }}
            >
              0
            </button>
            <button
              onClick={onBackspace}
              className={buttonBase}
              style={secondaryButton}
            >
              Apagar
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            {alphaNumericRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex justify-center gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => onType(key)}
                    className={`${buttonBase} w-16`}
                    style={{ background: ROSA, color: VERDE }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-2">
              <button
                onClick={onClear}
                className={`${buttonBase} w-32`}
                style={secondaryButton}
              >
                Limpar
              </button>
              <button
                onClick={() => onType(" ")}
                className={`${buttonBase} w-80`}
                style={{ background: ROSA, color: VERDE }}
              >
                Espaco
              </button>
              <button
                onClick={onBackspace}
                className={`${buttonBase} w-36`}
                style={secondaryButton}
              >
                Apagar
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
