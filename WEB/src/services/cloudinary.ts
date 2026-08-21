export async function uploadDoctorProfilePhoto(file: File): Promise<string> {
  if (!file) {
    throw new Error("No image file provided.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please upload an image file (JPG, PNG, WebP).");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image size exceeds 10MB limit. Please select a smaller photo.");
  }

  // 1. Try Direct Cloudinary API
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "medlink_profile");

    const response = await fetch("https://api.cloudinary.com/v1_1/xsjgnsvi/image/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }
  } catch (e) {
    console.warn("Direct Cloudinary upload endpoint unavailable, attempting fallback upload method:", e);
  }

  // 2. Try Simulated Server Cloudinary Endpoint
  try {
    const base64 = await readFileAsBase64(file);
    const res = await fetch("/api/cloudinary-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, filename: file.name }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }
  } catch (e) {
    console.warn("Server Cloudinary upload endpoint fallback error:", e);
  }

  // 3. Guaranteed client-side FileReader Base64 fallback
  return readFileAsBase64(file);
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function formatCloudinaryAvatarUrl(photoUrl?: string | null): string {
  if (!photoUrl || photoUrl.trim() === "") {
    return "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400";
  }
  return photoUrl;
}

export async function uploadMedicalCertificate(file: File): Promise<string> {
  if (!file) {
    throw new Error("No certificate file provided.");
  }

  const isValidType = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!isValidType) {
    throw new Error("Invalid file type. Please upload a PDF or an image file (JPG, PNG, WebP).");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File size exceeds 15MB limit. Please select a smaller document.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "medlink_profile");
    formData.append("folder", "medical_certificates"); // Explicitly setting folder

    const response = await fetch("https://api.cloudinary.com/v1_1/xsjgnsvi/auto/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    } else {
      console.warn("Direct Cloudinary upload failed:", await response.text());
    }
  } catch (e) {
    console.warn("Direct Cloudinary upload endpoint unavailable:", e);
  }

  throw new Error("Failed to upload medical certificate securely. Please try again later.");
}

export async function uploadGovernmentId(file: File): Promise<string> {
  if (!file) {
    throw new Error("No Government ID file provided.");
  }

  const isValidType = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!isValidType) {
    throw new Error("Invalid file type. Please upload a PDF or an image file (JPG, PNG, WebP).");
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File size exceeds 15MB limit. Please select a smaller document.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "medlink_profile");
    formData.append("folder", "government_ids"); // Explicitly setting folder

    const response = await fetch("https://api.cloudinary.com/v1_1/xsjgnsvi/auto/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    } else {
      console.warn("Direct Cloudinary upload failed:", await response.text());
    }
  } catch (e) {
    console.warn("Direct Cloudinary upload endpoint unavailable:", e);
  }

  throw new Error("Failed to upload Government ID securely. Please try again later.");
}
