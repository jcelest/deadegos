export async function uploadAdminImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  let data: { url?: string; error?: string } = {};
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "Upload failed: invalid server response"
        : `Upload failed (${response.status}). Try a smaller image or upload one at a time.`
    );
  }

  if (!response.ok || !data.url) {
    throw new Error(data.error || `Upload failed (${response.status})`);
  }

  return data.url;
}
