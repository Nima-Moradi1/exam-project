import "server-only";

const allowed = new Map([
  ["image/jpeg", { kind: "IMAGE" as const, maxSize: 8 * 1024 * 1024 }],
  ["image/png", { kind: "IMAGE" as const, maxSize: 8 * 1024 * 1024 }],
  ["image/webp", { kind: "IMAGE" as const, maxSize: 8 * 1024 * 1024 }],
  ["image/gif", { kind: "IMAGE" as const, maxSize: 8 * 1024 * 1024 }],
  ["audio/mpeg", { kind: "AUDIO" as const, maxSize: 25 * 1024 * 1024 }],
  ["audio/ogg", { kind: "AUDIO" as const, maxSize: 25 * 1024 * 1024 }],
  ["application/pdf", { kind: "DOCUMENT" as const, maxSize: 15 * 1024 * 1024 }]
]);

export function validateUpload(file: File) {
  const metadata = allowed.get(file.type);
  if (!metadata) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  if (!file.size || file.size > metadata.maxSize) throw new Error("FILE_TOO_LARGE");
  if (/\.(?:exe|msi|sh|bat|cmd|js|html?)$/i.test(file.name)) throw new Error("UNSUPPORTED_MEDIA_TYPE");
  return metadata;
}
