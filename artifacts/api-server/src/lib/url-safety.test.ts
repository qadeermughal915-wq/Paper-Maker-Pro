import test from "node:test";
import assert from "node:assert/strict";
import {
  isPrivateIp,
  isImageDataUri,
  isSafeHttpUrl,
  validateLogoUrl,
} from "./url-safety.ts";

test("isPrivateIp flags loopback, private, and link-local ranges", () => {
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.1.2.3"), true);
  assert.equal(isPrivateIp("172.16.5.5"), true);
  assert.equal(isPrivateIp("192.168.0.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true); // cloud metadata
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);
  assert.equal(isPrivateIp("fc00::1"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true); // mapped loopback
  // Public addresses are allowed.
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
});

test("isSafeHttpUrl rejects internal targets without DNS", async () => {
  assert.equal(await isSafeHttpUrl("http://127.0.0.1/x"), false);
  assert.equal(await isSafeHttpUrl("http://localhost/x"), false);
  assert.equal(await isSafeHttpUrl("http://169.254.169.254/latest"), false);
  assert.equal(await isSafeHttpUrl("http://10.0.0.5/logo.png"), false);
  assert.equal(await isSafeHttpUrl("http://192.168.1.1/logo.png"), false);
  assert.equal(await isSafeHttpUrl("http://[::1]/logo.png"), false);
  assert.equal(await isSafeHttpUrl("file:///etc/passwd"), false);
  assert.equal(await isSafeHttpUrl("not a url"), false);
});

test("isSafeHttpUrl allows public IP literals", async () => {
  assert.equal(await isSafeHttpUrl("https://8.8.8.8/logo.png"), true);
  assert.equal(await isSafeHttpUrl("http://1.1.1.1/logo.png"), true);
});

test("isImageDataUri only matches base64 image data URIs", () => {
  assert.equal(isImageDataUri("data:image/png;base64,AAAA"), true);
  assert.equal(isImageDataUri("data:image/svg+xml;base64,AAAA"), true);
  assert.equal(isImageDataUri("data:text/html;base64,AAAA"), false);
  assert.equal(isImageDataUri("https://example.com/x.png"), false);
});

test("validateLogoUrl accepts safe inputs and rejects unsafe ones", async () => {
  assert.equal(await validateLogoUrl(null), null);
  assert.equal(await validateLogoUrl(""), null);
  assert.equal(await validateLogoUrl("data:image/png;base64,AAAA"), null);
  assert.equal(await validateLogoUrl("https://8.8.8.8/logo.png"), null);
  // Unsafe inputs return an error message.
  assert.notEqual(await validateLogoUrl("data:text/html,<script>"), null);
  assert.notEqual(await validateLogoUrl("ftp://example.com/x.png"), null);
  assert.notEqual(await validateLogoUrl("http://127.0.0.1/logo.png"), null);
  assert.notEqual(await validateLogoUrl("http://169.254.169.254/x"), null);
});
