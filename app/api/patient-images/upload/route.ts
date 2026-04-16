import { NextResponse } from "next/server";
import crypto from "crypto";
import { createPatientImage } from "@/lib/records/service";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

function isAllowedFile(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return true;
  }
  const name = file.name?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function signCloudinaryPayload(payload: Record<string, string>, secret: string) {
  const sorted = Object.keys(payload)
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(sorted + secret).digest("hex");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const patientId = String(formData.get("patient_id") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const takenAt = String(formData.get("taken_at") ?? "").trim();
    const file = formData.get("file");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id requerido" },
        { status: 400 }
      );
    }

    let finalCategory = category?.toLowerCase().trim();

    if (finalCategory === "imagen") finalCategory = "image";
    if (finalCategory === "radiografia" || finalCategory === "radiografía") {
      finalCategory = "xray";
    }
    if (finalCategory === "documento") finalCategory = "document";

    if (finalCategory === "image") finalCategory = "extraoral_front";
    if (finalCategory === "xray") finalCategory = "xray_panoramic";
    if (finalCategory === "document") finalCategory = "other";

    const allowed = [
      "extraoral_front",
      "extraoral_profile",
      "extraoral_smile",
      "intraoral_upper",
      "intraoral_lower",
      "intraoral_lateral",
      "xray_panoramic",
      "xray_cephalometric",
      "xray_periapical",
      "evolution",
      "other",
    ];

    if (!allowed.includes(finalCategory)) {
      throw new Error("Invalid category: " + finalCategory);
    }

    console.log("FINAL CATEGORY:", finalCategory);

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Archivo requerido" },
        { status: 400 }
      );
    }

    if (!isAllowedFile(file)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el tamanio maximo" },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary no configurado" },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `odonto/patients/${patientId}/${finalCategory}`;
    const signature = signCloudinaryPayload(
      { folder, timestamp: String(timestamp) },
      apiSecret
    );

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    uploadForm.append("signature", signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: uploadForm,
      }
    );

    const uploadJson = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return NextResponse.json(
        { error: uploadJson?.error?.message ?? "No se pudo subir el archivo" },
        { status: 500 }
      );
    }

    const result = await createPatientImage({
      patient_id: patientId,
      cloudinary_url: uploadJson.secure_url,
      cloudinary_public_id: uploadJson.public_id,
      category: finalCategory as "image" | "xray" | "document",
      taken_at: takenAt || null,
      notes: notes || null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message ?? "No se pudo guardar el archivo" },
        { status: 400 }
      );
    }

    return NextResponse.json({ image: result.image });
  } catch (error) {
    return NextResponse.json(
      { error: "Error inesperado al subir el archivo" },
      { status: 500 }
    );
  }
}
