export function formatDeliveryAddress({
  street,
  number,
  complement,
}: {
  street: string;
  number: string;
  complement?: string;
}) {
  const cleanStreet = normalizeSpaces(street);
  const cleanNumber = normalizeSpaces(number);
  const cleanComplement = normalizeSpaces(complement ?? "");
  if (!cleanStreet || !cleanNumber) return cleanStreet || cleanNumber;

  const commaIndex = cleanStreet.indexOf(",");
  const mainStreet = commaIndex >= 0 ? cleanStreet.slice(0, commaIndex).trim() : cleanStreet;
  const region = commaIndex >= 0 ? cleanStreet.slice(commaIndex + 1).trim() : "";
  const firstLine = [mainStreet, cleanNumber].filter(Boolean).join(" ");
  const address = region ? `${firstLine}, ${region}` : firstLine;
  return cleanComplement ? `${address}\nApto/casa ${cleanComplement}` : address;
}

export function formatAddressForReceipt(address: string) {
  const normalized = normalizeSpaces(address).replace(/\s*\n\s*/g, "\n");
  if (!normalized) return "Nao informado";
  const [firstLine, ...extraLines] = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const fixedFirstLine = moveTrailingNumberAfterStreet(firstLine);
  return [fixedFirstLine, ...extraLines].join("\n");
}

export function googleMapsDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    normalizeSpaces(destination.replace(/\n/g, ", ")),
  )}&travelmode=driving`;
}

function moveTrailingNumberAfterStreet(address: string) {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return address;

  const trailing = parts[parts.length - 1];
  const match = trailing.match(/^(\d+[A-Za-z]?)(?:\s+(.+))?$/);
  if (!match) return address;

  const number = match[1];
  const complement = match[2];
  const street = parts[0].replace(/\s+\d+[A-Za-z]?$/, "");
  const middle = parts.slice(1, -1).join(", ");
  const firstLine = `${street} ${number}`;
  const fixed = middle ? `${firstLine}, ${middle}` : firstLine;
  return complement ? `${fixed}\nApto/casa ${complement}` : fixed;
}

function normalizeSpaces(value: string) {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}
