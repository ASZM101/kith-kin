
export type Mood = "happy" | "neutral" | "hungry" | "sad";

export interface Info {
  coins: number;
  happiness: number;
}

export interface HistoryItem {
  question: string;
  answer: string;
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

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

type Body = { form: Record<string, string> } | { json: unknown };

async function request(method: string, path: string, body?: Body): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = session.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body && "form" in body) {
    const form = new FormData();
    for (const [key, value] of Object.entries(body.form)) form.append(key, value);
    payload = form;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body.json);
  }

  const res = await fetch(path, { method, headers, body: payload });

  if (res.status === 401 && path !== "/login") {
    session.clear();
    onUnauthorized();
  }
  return res;
}

async function fail(res: Response): Promise<never> {
  throw new ApiError(res.status, (await res.text()) || res.statusText);
}

export const SPENDS = [1, 5, 10] as const;
export type Spend = (typeof SPENDS)[number];

const ANSWER_REWARD = 5;

export const api = {
  async login(username: string, password: string) {
    const res = await request("POST", "/login", { form: { username, password } });
    if (res.status === 401 || res.status === 500) throw new ApiError(401, "Wrong username or password");
    if (!res.ok) return fail(res);
    const { token } = await res.json();
    session.save(token, username);
  },

  async logout() {
    await request("POST", "/logout").catch(() => {});
    session.clear();
  },

  async question(): Promise<string> {
    const res = await request("GET", "/question");
    if (!res.ok) return fail(res);
    return res.text();
  },

  async answer(question: string, answer: string) {
    const res = await request("POST", "/question", { form: { question, answer } });
    if (!res.ok) return fail(res);
  },

  async info(): Promise<Info> {
    const res = await request("GET", "/info");
    if (!res.ok) return fail(res);
    return res.json();
  },

  async history(page: number, count: number): Promise<HistoryItem[]> {
    const res = await request("GET", `/history?page=${page}&count=${count}`);
    if (!res.ok) return fail(res);
    return res.json();
  },

  async spend(coins: Spend) {
    const res = await request("POST", "/spend", { json: { coins } });
    if (!res.ok) return fail(res);
  },

  rewards: { answer: ANSWER_REWARD }
};

export function moodOf(happiness: number): Mood {
  if (happiness < 30) return "sad";
  if (happiness >= 60) return "happy";
  return "neutral";
}
