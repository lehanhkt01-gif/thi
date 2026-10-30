// src/lib/env.ts - Tiện ích ghi và cập nhật biến môi trường bảo mật (.env)
// Server-only runtime safe

let fsModule: any = null;
let pathModule: any = null;
if (typeof window === "undefined") {
  try {
    fsModule = require("fs");
    pathModule = require("path");
  } catch (e) {}
}

/**
 * Cập nhật hoặc thêm mới biến môi trường vào tệp .env (tuyệt đối không bị đẩy lên Git)
 */
export function updateEnvVariable(key: string, value: string): boolean {
  if (!fsModule || !pathModule) return false;
  try {
    const envPath = pathModule.join(process.cwd(), ".env");
    let content = "";

    if (fsModule.existsSync(envPath)) {
      content = fsModule.readFileSync(envPath, "utf-8");
    } else {
      const examplePath = pathModule.join(process.cwd(), ".env.example");
      if (fsModule.existsSync(examplePath)) {
        content = fsModule.readFileSync(examplePath, "utf-8");
      }
    }

    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += (content.endsWith("\n") || content === "" ? "" : "\n") + `${key}=${value}\n`;
    }

    fsModule.writeFileSync(envPath, content, "utf-8");
    return true;
  } catch (err) {
    console.error("[Env] Lỗi ghi tệp .env:", err);
    return false;
  }
}

/**
 * Lưu mật khẩu Admin toàn quyền vào file bảo mật .env
 */
export function updateEnvAdminPassword(newPassword: string): boolean {
  const ok1 = updateEnvVariable("ADMIN_DEFAULT_PASSWORD", newPassword);
  const ok2 = updateEnvVariable("ADMIN_PASSWORD", newPassword);
  return ok1 || ok2;
}
