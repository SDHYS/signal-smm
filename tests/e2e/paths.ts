import path from "node:path";

// 관리자 storageState 파일 경로 (auth.setup.ts가 생성, admin 테스트가 재사용)
export const ADMIN_STATE = path.join(__dirname, ".auth", "admin.json");
