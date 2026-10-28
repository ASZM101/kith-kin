// Client for the API described in notes.md.
//
// Auth and GET /question already exist in app/src/index.ts. The other routes
// (POST /question, /info, /history) are called for real, and if the backend
// answers 404 because the route isn't built yet, a local stub fills in so the
// UI still works. Feeding and petting have no route in notes.md at all.
// TODO: once the backend implements these, delete the stub fallbacks below.

export type Mood = "happy" | "neutral" | "hungry" | "sad";

// Expected shape of GET /info (not implemented on the backend yet)
export interface Info {
  username: string;
  partner: string | null;
  coins: number;
  streak: number;
  pet: { name: string; hunger: number; happiness: number };
}

// Expected shape of GET /history (not implemented on the backend yet)
export interface HistoryPage {
  page: number;
  count: number;
  total: number;
  items: { question: string; answers: { username: string; answer: string; answered_at: string }[] }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TOKEN_KEY = "kithkin.token";
const USERNAME_KEY = "kithkin.username";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const session = {
  token: () => storage()?.getItem(TOKEN_KEY) ?? null,
  username: () => storage()?.getItem(USERNAME_KEY) ?? "",
  save(token: string, username: string) {
    storage()?.setItem(TOKEN_KEY, token);
    storage()?.setItem(USERNAME_KEY, username);
  },
  clear() {
    storage()?.removeItem(TOKEN_KEY);
    storage()?.removeItem(USERNAME_KEY);
  }
};

// Called when the server rejects the token so the app can return to login
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request(method: string, path: string, form?: Record<string, string>): Promise<Response> {
  const token = session.token();
  let body: FormData | undefined;
  if (form) {
    body = new FormData();
    for (const [key, value] of Object.entries(form)) body.append(key, value);
  }

  const res = await fetch(path, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });

  if (res.status === 401 && path !== "/login") {
    session.clear();
    onUnauthorized();
  }
  return res;
}

async function fail(res: Response): Promise<never> {
  throw new ApiError(res.status, (await res.text()) || res.statusText);
}

// ---- Local stubs ---------------------------------------------------------
// TODO: stand-in storage until the backend stores pet state, coins and
// history. Lives in memory, so it resets on page reload.

const FEED_COST = 5;
const PET_COST = 3;
const ANSWER_REWARD = 10;

const stub = {
  info: {
    username: "",
    partner: null,
    coins: 20,
    streak: 0,
    pet: { name: "Kith", hunger: 70, happiness: 70 }
  } as Info,
  history: [] as HistoryPage["items"]
};

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function stubInfo(): Info {
  return { ...stub.info, username: session.username(), pet: { ...stub.info.pet } };
}

function stubRecordAnswer(question: string, answer: string) {
  stub.info.coins += ANSWER_REWARD;
  let item = stub.history.find(h => h.question === question);
  if (!item) {
    item = { question, answers: [] };
    stub.history.unshift(item);
  }
  item.answers.push({ username: session.username(), answer, answered_at: new Date().toISOString() });
}

// ---- API -----------------------------------------------------------------

export const api = {
  // POST /login, formdata: username and password, returns { token }
  async login(username: string, password: string) {
    const res = await request("POST", "/login", { username, password });
    if (res.status === 401) throw new ApiError(401, "Wrong username or password");
    if (!res.ok) return fail(res);
    const { token } = await res.json();
    session.save(token, username);
  },

  // POST /logout, invalidates the session token
  async logout() {
    await request("POST", "/logout").catch(() => {});
    session.clear();
  },

  // GET /question, returns a random question as plain text
  async question(): Promise<string> {
    const res = await request("GET", "/question");
    if (!res.ok) return fail(res);
    const text = await res.text();
    // Accept JSON too in case the backend switches to { question } later
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") return parsed;
      if (parsed && typeof parsed.question === "string") return parsed.question;
    } catch {
      // plain text, which is what the backend sends today
    }
    return text;
  },

  // POST /question, formdata: question, answer
  async answer(question: string, answer: string) {
    const res = await request("POST", "/question", { question, answer });
    if (res.status === 404) {
      // TODO: route not built yet, keep the answer locally for now
      stubRecordAnswer(question, answer);
      return;
    }
    if (!res.ok) return fail(res);
  },

  // GET /info, pet stats, coins and streak
  async info(): Promise<Info> {
    const res = await request("GET", "/info");
    if (res.status === 404) return stubInfo(); // TODO: remove once /info exists
    if (!res.ok) return fail(res);
    return res.json();
  },

  // GET /history?page=<page>&count=<count>
  async history(page: number, count: number): Promise<HistoryPage> {
    const res = await request("GET", `/history?page=${page}&count=${count}`);
    if (res.status === 404) {
      // TODO: remove once /history exists
      return {
        page,
        count,
        total: stub.history.length,
        items: stub.history.slice((page - 1) * count, page * count)
      };
    }
    if (!res.ok) return fail(res);
    return res.json();
  },

  // Feeding and petting are in the notes' feature list but have no API route.
  // TODO: point these at real backend routes when they exist.
  async feed(): Promise<Info> {
    if (stub.info.coins < FEED_COST) throw new ApiError(402, "Not enough coins");
    stub.info.coins -= FEED_COST;
    stub.info.pet.hunger = clamp(stub.info.pet.hunger + 25);
    return stubInfo();
  },

  async pet(): Promise<Info> {
    if (stub.info.coins < PET_COST) throw new ApiError(402, "Not enough coins");
    stub.info.coins -= PET_COST;
    stub.info.pet.happiness = clamp(stub.info.pet.happiness + 15);
    return stubInfo();
  },

  costs: { feed: FEED_COST, pet: PET_COST, answer: ANSWER_REWARD }
};

export function moodOf(pet: Info["pet"]): Mood {
  if (pet.hunger < 30) return "hungry";
  if (pet.happiness < 30) return "sad";
  if (pet.hunger >= 60 && pet.happiness >= 60) return "happy";
  return "neutral";
}
