// 테스트용 next/headers 스텁 — IP/쿠키를 테스트에서 제어할 수 있게 한다
type CookieRecord = { name: string; value: string };

const cookieStore = new Map<string, string>();
let fakeIp = "127.0.0.1";

export function __setTestIp(ip: string) {
  fakeIp = ip;
}
export function __resetTestState() {
  cookieStore.clear();
  fakeIp = "127.0.0.1";
}

export async function headers() {
  return {
    get(name: string) {
      if (name.toLowerCase() === "x-forwarded-for") return fakeIp;
      return null;
    },
  };
}

export async function cookies() {
  return {
    get(name: string): CookieRecord | undefined {
      const v = cookieStore.get(name);
      return v === undefined ? undefined : { name, value: v };
    },
    set(name: string, value: string, _opts?: unknown) {
      cookieStore.set(name, value);
    },
    delete(name: string) {
      cookieStore.delete(name);
    },
  };
}
