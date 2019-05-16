const MagicKey = require("../src/MagicKey");
const Cryptr = require("cryptr");

describe("MagicKey", () => {
  describe("generateKey", () => {
    test("generate cryptr key with json", () => {
      const magicKey = new MagicKey();
      const cryptr = new Cryptr("changeMe!");
      const email = "agathe.zeublouse@commit42.fr";

      const result = magicKey.generateKey(email);
      const decryptedResult = cryptr.decrypt(result);
      const jsonResult = JSON.parse(decryptedResult);

      expect(typeof jsonResult).toBe("object");
      expect(Object.keys(jsonResult)).toEqual([
        "email",
        "clientVerificationKey",
        "created"
      ]);
      expect(jsonResult.email).toBe(email);
      expect(jsonResult.clientVerificationKey).toBe(null);
      expect(jsonResult.created).toBeGreaterThanOrEqual(Date.now() / 1000 - 20);
      expect(jsonResult.created).toBeLessThanOrEqual(Date.now() / 1000 + 20);
    });

    test("can change privateKey", () => {
      const privateKey = "newPrivateKey";
      const magicKey = new MagicKey({ privateKey });
      const cryptr = new Cryptr(privateKey);
      const email = "agathe.zeublouse@commit42.fr";

      const result = magicKey.generateKey(email);
      const decryptedResult = cryptr.decrypt(result);
      const jsonResult = JSON.parse(decryptedResult);

      expect(typeof jsonResult).toBe("object");
    });

    test("check if email is valid", () => {
      const magicKey = new MagicKey();

      expect(
        magicKey.generateKey("agathe.zeublouse@protonmail.com@commit42.fr")
      ).toBe(false);
      expect(typeof magicKey.generateKey("agathe.zeublouse@commit42.fr")).toBe(
        "string"
      );
    });

    test("can filter by emails : domain", () => {
      const magicKey = new MagicKey({
        allowedEmails: [/@commit42.fr$/, /@gmail.com$/]
      });

      expect(magicKey.generateKey("agathe.zeublouse@outlook.com")).toBe(false);
      expect(typeof magicKey.generateKey("agathe.zeublouse@commit42.fr")).toBe(
        "string"
      );
      expect(typeof magicKey.generateKey("agathe.zeublouse@gmail.com")).toBe(
        "string"
      );
    });

    test("can filter by emails : complete email", () => {
      const magicKey = new MagicKey({
        allowedEmails: [/^agathe.zeublouse@commit42.fr$/]
      });

      expect(magicKey.generateKey("gilles.parbal@commit42.fr")).toBe(false);
      expect(typeof magicKey.generateKey("agathe.zeublouse@commit42.fr")).toBe(
        "string"
      );
    });
  });

  describe("decryptKey", () => {
    test("decrypt a key", () => {
      const magicKey = new MagicKey();
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);
      const decryptedResult = magicKey.decryptKey(key);

      expect(typeof decryptedResult).toBe("object");
      expect(Object.keys(decryptedResult)).toEqual([
        "email",
        "clientVerificationKey",
        "created"
      ]);
      expect(decryptedResult.email).toBe(email);
      expect(decryptedResult.clientVerificationKey).toBe(null);
      expect(decryptedResult.created).toBeGreaterThanOrEqual(
        Date.now() / 1000 - 20
      );
      expect(decryptedResult.created).toBeLessThanOrEqual(
        Date.now() / 1000 + 20
      );
    });

    test("return false if private key is not equal", () => {
      const magicKey = new MagicKey({ privateKey: "myPrivateKey" });
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);

      const otherMagicKey = new MagicKey({ privateKey: "myOtherPrivateKey" });
      const decryptedResult = otherMagicKey.decryptKey(key);

      expect(decryptedResult).toBe(false);
    });
  });

  describe("validateKey", () => {
    test("by default is valid if can decrypt key", () => {
      const magicKey = new MagicKey();
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);

      expect(magicKey.validateKey(key)).toBe(true);
    });

    test("by default is not valid if can't decrypt key", () => {
      const magicKey = new MagicKey({ privateKey: "myPrivateKey" });
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);

      const otherMagicKey = new MagicKey({ privateKey: "myOtherPrivateKey" });

      expect(otherMagicKey.validateKey(key)).toBe(false);
    });

    test("can expire", () => {
      const magicKey = new MagicKey({ expire: 2 }); // 2 sec
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);

      const cryptr = new Cryptr("changeMe!");
      const expiredKey = cryptr.encrypt(
        JSON.stringify({
          email,
          clientVerificationKey: null,
          created: Date.now() / 1000 - 10
        })
      );

      expect(magicKey.validateKey(key)).toBe(true);
      expect(magicKey.validateKey(expiredKey)).toBe(false);
    });

    test("can check with client key", () => {
      const magicKey = new MagicKey({ clientVerification: true });
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email, "myClientKey");

      expect(magicKey.validateKey(key, "myClientKey")).toBe(true);
      expect(magicKey.validateKey(key)).toBe(false);
      expect(magicKey.validateKey(key, "badClientKey")).toBe(false);
    });
  });

  describe("getLastValidationErrorMessage", () => {
    test("no return message if success", () => {
      const magicKey = new MagicKey();
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email);
      magicKey.validateKey(key);

      expect(magicKey.getLastValidationErrorMessage()).toBe(null);
    });

    test("return message if failed", () => {
      const magicKey = new MagicKey({ clientVerification: true });
      const email = "agathe.zeublouse@commit42.fr";

      const key = magicKey.generateKey(email, "myClientKey");
      magicKey.validateKey(key, "badClientKey");

      expect(typeof magicKey.getLastValidationErrorMessage()).toBe("string");
    });
  });
});
