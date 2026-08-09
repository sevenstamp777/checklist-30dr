#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = "https://api.pinterest.com/v5";
const TOKEN = process.env.PINTEREST_TOKEN;
const DRY = process.env.DRY_RUN === "1";
const TZ = "America/Sao_Paulo";
const MAX_RETRIES = 3;

function log(msg) {
  const ts = new Date().toLocaleString("pt-BR", { timeZone: TZ });
  console.log(`[${ts}] ${msg}`);
}

function todayBRT() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

async function api(path, { method = "GET", body, retries = MAX_RETRIES } = {}) {
  let url = `${API}${path}`;
  let attempts = 0;
  for (;;) {
    attempts++;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const remaining = res.headers.get("x-ratelimit-remaining");
    const limit = res.headers.get("x-ratelimit-limit");
    const reset = res.headers.get("x-ratelimit-reset");
    if (remaining !== null && limit !== null) {
      log(`rate-limit: ${remaining}/${limit} restantes, reset em ${reset}s`);
    }

    if (res.status === 429 && attempts <= retries) {
      const wait = Math.max(
        Number(res.headers.get("x-ratelimit-reset")) || 0,
        Number(res.headers.get("Retry-After")) || 30,
      );
      log(`429 rate limit — aguardando ${wait}s e tentando de novo (${attempts}/${retries})`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const detail = data?.message || text || res.statusText;
      throw new Error(`Pinterest ${res.status}: ${detail}`);
    }

    return { data, headers: res.headers };
  }
}

async function listBoards() {
  const boards = [];
  let bookmark = null;
  do {
    const qs = new URLSearchParams({ page_size: "100" });
    if (bookmark) qs.set("bookmark", bookmark);
    const { data } = await api(`/boards?${qs}`);
    for (const b of data.items || []) boards.push({ id: b.id, name: b.name });
    bookmark = data.bookmark || null;
  } while (bookmark);
  return boards;
}

function boardId(boards, name) {
  const found = boards.find((b) => b.name.toLowerCase() === String(name).toLowerCase());
  return found ? found.id : null;
}

function loadSchedule() {
  const raw = fs.readFileSync(path.join(__dirname, "schedule.json"), "utf8");
  return JSON.parse(raw);
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "state.json"), "utf8"));
  } catch {
    return { published: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(path.join(__dirname, "state.json"), JSON.stringify(state, null, 2) + "\n");
}

async function checkImage(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function publishPin(pin, boardId, dry) {
  const body = {
    board_id: boardId,
    media_source: {
      source_type: "pin_url",
      content_type: "image/jpeg",
      url: pin.imageUrl,
    },
    title: pin.title,
    description: pin.description,
    alt_text: pin.alt_text,
    link: pin.link,
  };

  if (dry) {
    log(`DRY-RUN: criaria pin "${pin.id}" no board "${pin.board}"`);
    return "dry-run";
  }

  const { data } = await api("/pins", { method: "POST", body });
  log(`pin criado: ${pin.id} -> https://www.pinterest.com/pin/${data.id}`);
  return data.id;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--boards")) {
    const boards = await listBoards();
    log(`Boards encontrados: ${boards.length}`);
    for (const b of boards) log(`  ${b.id}  ${b.name}`);
    return;
  }

  if (!TOKEN) throw new Error("PINTEREST_TOKEN não definido");

  const schedule = loadSchedule();
  const state = loadState();
  const boards = await listBoards();
  const today = todayBRT();
  const defaults = schedule.defaults || {};

  const due = (schedule.pins || []).filter(
    (p) =>
      p.status === "scheduled" &&
      (p.publishDate || today) <= today &&
      !state.published[p.id],
  );

  log(`Pins agendados para hoje (${today}): ${due.length}`);

  let changed = false;
  for (const pin of due) {
    const board = pin.board || defaults.board;
    const id = boardId(boards, board);
    if (!id) {
      log(`ERRO: board "${board}" não encontrado. Boards disponíveis:`);
      for (const b of boards) log(`  ${b.id}  ${b.name}`);
      process.exitCode = 1;
      continue;
    }

    const img = await checkImage(pin.imageUrl);
    if (!img.ok) {
      log(`AVISO: imagem não acessível (HTTP ${img.status}): ${pin.imageUrl}`);
    }

    const result = await publishPin(pin, id, DRY);
    if (result !== "dry-run") {
      state.published[pin.id] = { at: new Date().toISOString(), pinId: result };
      changed = true;
    }
  }

  if (changed) saveState(state);

  const skipped = (schedule.pins || []).filter((p) => p.status !== "scheduled");
  log(`Pins fora do cronograma (draft/outros): ${skipped.length}`);
  log(DRY ? "DRY-RUN concluído — nada foi postado." : "Execução concluída.");
}

main().catch((err) => {
  log(`FALHA: ${err.message}`);
  process.exit(1);
});
