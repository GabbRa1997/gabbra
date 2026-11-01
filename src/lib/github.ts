/**
 * The admin saves by committing to the GitHub repository, straight from the browser.
 * Every save is a normal commit, so the site rebuilds itself and nothing is ever lost.
 */

export const REPO = "GabbRa1997/gabbra";
export const BRANCH = "main";
const KEY = "gabbra:admin-token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string) => {
  try {
    localStorage.setItem(KEY, t);
  } catch {}
};
export const clearToken = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

async function call(path: string, init: RequestInit = {}, token = getToken()) {
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  return res;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).message ?? "";
    } catch {}
    if (res.status === 401) throw new Error("GitHub did not accept the token. It may have expired: sign in again.");
    if (res.status === 403 || res.status === 404) throw new Error(`GitHub says no (${res.status}). ${detail} Check the token can read and write this repository.`);
    throw new Error(`GitHub error ${res.status}. ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** Is this token valid, and allowed to write to the site? */
export async function checkToken(token: string): Promise<string | null> {
  try {
    const res = await call("", {}, token);
    if (res.status === 401) return "GitHub did not recognise that token.";
    if (!res.ok) return "That token cannot see the GabbRa repository. When creating it, choose the gabbra repository.";
    const data = (await res.json()) as { permissions?: { push?: boolean } };
    if (!data.permissions?.push) return "That token can read the site but not change it. Give it Contents: Read and write.";
    return null;
  } catch {
    return "Could not reach GitHub. Check your connection.";
  }
}

export async function readText(path: string): Promise<string | null> {
  const res = await call(`/contents/${path}?ref=${BRANCH}`, { headers: { Accept: "application/vnd.github.raw+json" } });
  if (res.status === 404) return null;
  if (!res.ok) await json(res);
  return res.text();
}

export async function listDir(path: string): Promise<{ name: string; path: string; type: string }[]> {
  const res = await call(`/contents/${path}?ref=${BRANCH}`);
  if (res.status === 404) return [];
  return json(res);
}

export interface FileChange {
  path: string;
  text?: string;
  base64?: string;
  remove?: boolean;
}

/** Save several files (and deletions) as ONE commit. */
export async function commit(changes: FileChange[], message: string): Promise<void> {
  if (changes.length === 0) return;
  const ref = await json<{ object: { sha: string } }>(await call(`/git/ref/heads/${BRANCH}`));
  const head = ref.object.sha;
  const parent = await json<{ tree: { sha: string } }>(await call(`/git/commits/${head}`));

  const tree: { path: string; mode: string; type: string; sha: string | null }[] = [];
  const queue = [...changes];
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      if (c.remove) {
        tree.push({ path: c.path, mode: "100644", type: "blob", sha: null });
        continue;
      }
      const blob = await json<{ sha: string }>(
        await call("/git/blobs", {
          method: "POST",
          body: JSON.stringify(c.base64 !== undefined ? { content: c.base64, encoding: "base64" } : { content: c.text ?? "", encoding: "utf-8" }),
        }),
      );
      tree.push({ path: c.path, mode: "100644", type: "blob", sha: blob.sha });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);

  const newTree = await json<{ sha: string }>(
    await call("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree }) }),
  );
  const made = await json<{ sha: string }>(
    await call("/git/commits", { method: "POST", body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }) }),
  );
  await json(await call(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: made.sha }) }));
}

export const blobToBase64 = (b: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
