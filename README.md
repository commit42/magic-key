# magic-key

A node librairy for generate and validate magic key for Magic Links with node

## Requirements

- Nodejs 10+ (not tested on lower versions)

## Installation

### With Yarn

```shell
yarn add magic-key
```

### With NPM

```shell
npm install --save magic-key
```

## Quick start

```js
const MagicKey = require("magic-key");
const magicKey = new MagicKey({privateKey: "myPrivateKey"});
const otherMagicKey = new MagicKey({privateKey: "otherPrivateKey"});

// Générate key
const key = magicKey.generateKey("team@commit42.fr");

// Check if key is valid
magicKey.validateKey(key); // true
otherMagicKey.validateKey(key); // false

// Get validation error message
otherMagicKey.getLastValidationErrorMessage(); // Magic key is invalid
```

## Configuration and usages

Default instance config :

```js
{
  allowedEmails: true,
  privateKey: "changeMe!",
  clientVerification: false,
  expire: false
}
```

### allowedEmails

If `true` allows any valid email

You can use an array with Regex

```js
const magicKey = new MagicKey({
  privateKey: "myPrivateKey",
  allowedEmails: [
    /@commit42.fr$/,
    /^agathe.zeublouse@gmail.com$/
  ]
});

magicKey.generateKey("team@commit42.fr") // a key
magicKey.generateKey("zeublouse@gmail.com") // false
magicKey.generateKey("agathe.zeublouse@outlook.com") // false
```

### expire

By default the lifetime of the key is infinite

You can change that by defining a lifetime in seconds

```js
const magicKey = new MagicKey({
  privateKey: "myPrivateKey",
  expire: 3600 // 1h
});

const key = magicKey.generateKey("team@commit42.fr");

// wait 10 minutes
magicKey.validateKey(key); // true

// wait 2 hours
magicKey.validateKey(key); // false
```

### clientVerification

You can prevent key sharing by protecting the key with an additional key generated and stored on the browser.

For example, you can generate this type of key like this.

```js
// On browser (frontend)

/**
 * @link https://andywalpole.me/blog/140739/using-javascript-create-guid-from-users-browser-information
 */
const generateClientVerificationKey = () => {
  const nav = window.navigator;
  const screen = window.screen;
  let guid = nav.mimeTypes.length;
  guid += nav.userAgent.replace(/\D+/g, "");
  guid += nav.plugins.length;
  guid += screen.height || "";
  guid += screen.width || "";
  guid += screen.pixelDepth || "";

  return guid;
}
```

You will only have to send it to the server to generate a key

```js
const magicKey = new MagicKey({
  privateKey: "myPrivateKey",
  clientVerification: true
});

// Exemple of clientVerificationKey
const clientVerificationKey = "250118664537366703396996703396995373621200192024";

const key = magicKey.generateKey("team@commit42.fr", clientVerificationKey);

magicKey.validateKey(key, clientVerificationKey); // true
magicKey.validateKey(key); // false
magicKey.validateKey(key, 'badClientVerificationKey'); // false
```

## Api

- `generateKey(email, clientVerificationKey = null): string or false`

- `decryptKey(key): object or false`
Object contain email, creation timestamp and clientVerificationKey

- `validateKey(key, clientVerificationKey = null): boolean`

- `getLastValidationErrorMessage(): string or null`
Return the validation error message

## Contribution

### Execute yarn

with docker you can use yarn with this command :

```shell
docker-compose run --rm node yarn
```

### Commits

This project use [Commitizen](http://commitizen.github.io/cz-cli/), to commit to the project you can run the command :

```shell
yarn commit
```
