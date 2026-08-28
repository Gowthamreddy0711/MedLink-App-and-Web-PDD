import { CopilotContext, querySmartAssistant } from "./localCopilotEngine";

export async function queryClinicalAI(
  prompt: string,
  context: CopilotContext
): Promise<string> {
  const result = await querySmartAssistant(prompt, context);
  return result.answer;
}

export async function uploadToCloudinary(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch("/api/cloudinary-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            filename: file.name,
          }),
        });

        if (!res.ok) {
          throw new Error("Cloudinary upload failed");
        }

        const data = await res.json();
        resolve(data.secure_url || base64Data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}
