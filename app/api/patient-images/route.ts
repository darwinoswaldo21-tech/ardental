import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  deletePatientImageById,
  getPatientImageById,
  listPatientImages,
} from "@/lib/records/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId) {
    return NextResponse.json(
      { error: "patient_id requerido" },
      { status: 400 }
    );
  }

  try {
    const data = await listPatientImages(patientId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los archivos." },
      { status: 500 }
    );
  }
}

function signCloudinaryDestroy(publicId: string, timestamp: number, secret: string) {
  const payload = `public_id=${publicId}&timestamp=${timestamp}`;
  return crypto.createHash("sha1").update(payload + secret).digest("hex");
}

async function destroyCloudinaryAsset(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  publicId: string,
  resourceType: "image" | "raw"
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryDestroy(publicId, timestamp, apiSecret);
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    {
      method: "POST",
      body: form,
    }
  );

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.result === "error") {
    const message = json?.error?.message ?? "No se pudo eliminar el archivo";
    throw new Error(message);
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  try {
    const record = await getPatientImageById(id);

    if (!record) {
      return NextResponse.json(
        { error: "Archivo no encontrado" },
        { status: 404 }
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

    const isPdf = record.cloudinary_url.toLowerCase().includes(".pdf");

    if (isPdf) {
      await destroyCloudinaryAsset(
        cloudName,
        apiKey,
        apiSecret,
        record.cloudinary_public_id,
        "raw"
      );
    } else {
      await destroyCloudinaryAsset(
        cloudName,
        apiKey,
        apiSecret,
        record.cloudinary_public_id,
        "image"
      );
    }

    await deletePatientImageById(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el archivo" },
      { status: 500 }
    );
  }
}
