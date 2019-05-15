const Cryptr = require("cryptr");
const emailValidator = require("email-validator");

const defaultConfig = {
  allowedEmails: true,
  privateKey: "changeMe!",
  clientVerification: false,
  expire: false
};

module.exports = class MagicKey {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.cryptr = new Cryptr(this.config.privateKey);
    this.validationErrorMessage = null;
  }

  generateKey(email, clientVerificationKey = null) {
    if (!this._isValidEmail(email)) {
      return false;
    }

    return this.cryptr.encrypt(
      JSON.stringify({
        email,
        clientVerificationKey,
        created: Date.now()
      })
    );
  }

  decryptKey(key) {
    try {
      const decryptedKey = this.cryptr.decrypt(key);
      return JSON.parse(decryptedKey);
    } catch (e) {
      return false;
    }
  }

  validateKey(key, clientVerificationKey) {
    this.validationErrorMessage = null;
    const decryptedKey = this.decryptKey(key);

    if (!decryptedKey) {
      this.validationErrorMessage = "Magic key is invalid";
      return false;
    }

    if (this._isExpired(decryptedKey.created)) {
      this.validationErrorMessage = "Magic key expired";
      return false;
    }

    if (
      !this._isValidClientVerificationKey(
        clientVerificationKey,
        decryptedKey.clientVerificationKey
      )
    ) {
      this.validationErrorMessage = "ClientVerificationKey is invalid";
      return false;
    }

    return true;
  }

  getLastValidationErrorMessage() {
    return this.validationErrorMessage;
  }

  _isValidEmail(email) {
    const { allowedEmails } = this.config;

    if (!emailValidator.validate(email)) {
      return false;
    }

    if (allowedEmails === true) {
      return true;
    }

    if (!Array.isArray(allowedEmails)) {
      return false;
    }

    return !!allowedEmails.find(regex => !!email.match(regex));
  }

  _isValidClientVerificationKey(
    clientVerificationKeyToCheck,
    validClientVerificationKey
  ) {
    if (!this.config.clientVerification) {
      return true;
    }

    return clientVerificationKeyToCheck === validClientVerificationKey;
  }

  _isExpired(created) {
    const { expire } = this.config;

    if (expire === false) {
      return false;
    }

    return created + expire < Date.now();
  }
};
