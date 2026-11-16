export type MemberProfile = {
  favoritePokemon: string;
  collectingFocus: string;
  shipping: { recipient: string; line1: string; line2: string; city: string; region: string; postalCode: string; country: string };
};
export const emptyProfile: MemberProfile = { favoritePokemon: "", collectingFocus:"", shipping: { recipient: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "" } };
export function parseMemberProfile(value: unknown): MemberProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Please check your profile details.");
  const data = value as Record<string, unknown>;
  function text(value: unknown, max: number, multiline=false) {
    if (typeof value !== "string" || value.length > max || (multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/).test(value)) throw new Error("Please check the length and formatting of your details.");
    return value.trim();
  }
  const address = data.shipping as Record<string, unknown>;
  if (!address || typeof address !== "object" || Array.isArray(address)) throw new Error("Please check your shipping address.");
  const shipping = { recipient: text(address.recipient,100), line1: text(address.line1,160), line2: text(address.line2,160), city: text(address.city,100), region: text(address.region,100), postalCode: text(address.postalCode,24), country: text(address.country,80) };
  if (Object.values(shipping).some(Boolean) && (!shipping.recipient || !shipping.line1 || !shipping.city || !shipping.country)) throw new Error("Add the recipient, street address, city, and country, or clear the address to remove it.");
  return { favoritePokemon: text(data.favoritePokemon,60), collectingFocus:text(data.collectingFocus??"",160,true), shipping };
}
