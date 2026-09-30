type ClipboardWriter = Pick<Clipboard, "writeText">;

export async function copyText(
  text: string,
  clipboard: ClipboardWriter | undefined = navigator.clipboard,
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
