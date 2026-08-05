import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const guidesFile = path.join(dataDir, "guides.json");

export type GuideVideo = {
  id: string;
  title: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
};

type GuideInput = {
  title?: string;
  videoUrl?: string;
};

export async function getGuides() {
  try {
    const raw = await readFile(guidesFile, "utf8");
    const parsed = JSON.parse(raw) as GuideVideo[];
    return parsed.filter(isGuideVideo);
  } catch {
    return [];
  }
}

export async function createGuide(input: GuideInput) {
  const guides = await getGuides();
  const now = new Date().toISOString();
  const guide = normalizeGuide({
    ...input,
    id: makeUniqueId(input.title || "guide", guides),
    createdAt: now,
    updatedAt: now,
  });

  if (!guide) {
    throw new Error("Titre et video obligatoires.");
  }

  await saveGuides([guide, ...guides]);
  return guide;
}

export async function updateGuide(id: string, input: GuideInput) {
  const guides = await getGuides();
  const index = guides.findIndex((guide) => guide.id === id);

  if (index === -1) {
    return null;
  }

  const guide = normalizeGuide({
    ...guides[index],
    ...input,
    id,
    updatedAt: new Date().toISOString(),
  });

  if (!guide) {
    throw new Error("Titre et video obligatoires.");
  }

  guides[index] = guide;
  await saveGuides(guides);
  return guide;
}

export async function deleteGuide(id: string) {
  const guides = await getGuides();
  const nextGuides = guides.filter((guide) => guide.id !== id);

  if (nextGuides.length === guides.length) {
    return false;
  }

  await saveGuides(nextGuides);
  return true;
}

async function saveGuides(guides: GuideVideo[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(guidesFile, `${JSON.stringify(guides, null, 2)}\n`, "utf8");
}

function normalizeGuide(input: Partial<GuideVideo>) {
  const title = String(input.title || "").trim();
  const videoUrl = String(input.videoUrl || "").trim();

  if (!title || !videoUrl) {
    return null;
  }

  return {
    id: slugify(input.id || title),
    title,
    videoUrl,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
  } satisfies GuideVideo;
}

function isGuideVideo(value: GuideVideo) {
  return Boolean(value?.id && value.title && value.videoUrl);
}

function makeUniqueId(value: string, guides: GuideVideo[]) {
  const base = slugify(value);
  let candidate = base;
  let count = 2;

  while (guides.some((guide) => guide.id === candidate)) {
    candidate = `${base}-${count}`;
    count += 1;
  }

  return candidate;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "guide";
}
