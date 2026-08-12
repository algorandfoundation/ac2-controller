# Vendored packages

Interim home for the keystore-migrations builds that are **not published to
npm yet**, until the `feat/keystore-migrations` branches are released. Every
other `@algorandfoundation/*` package installs from the registry: the branch
builds of `keystore-core`, `keystore` (meta), `accounts-store`,
`identities-store`, `identities-extension`, `identities-keystore-extension`
and `log-store` were verified byte-identical to their published versions, so
they need no tarballs. The branch's `accounts-keystore-extension@canary.7` is
an unpublished semantic-release artifact (only its tests/devDeps changed) with
a `dist/` byte-identical to the published `canary.6`, so the registry version
is used instead.

Three tarballs, packed from the two local repository checkouts:

| Tarball                                                                | Source                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| `algorandfoundation-react-native-keystore-1.0.0-canary.14.tgz`         | `wallet-provider-extensions/keystore/react-native` |
| `algorandfoundation-provider-migrations-0.0.0.tgz`                     | `wallet-provider-extensions/migrations`            |
| `algorandfoundation-react-native-passkey-autofill-1.0.0-canary.23.tgz` | `react-native-passkey-autofill`                    |

Why each one is unpublishable-as-is:

- **`react-native-keystore`** — the migrations build is _also_ versioned
  `1.0.0-canary.14`, the same as the older build already published on npm.
  Only the `file:vendor/…tgz` spec guarantees the right build installs — never
  replace it with a registry range until a newer canary is actually published.
  The vendored build is the one whose `dist/migrations/` contains the
  `0001-flag-legacy-passkeys` and `0002-adopt-flat-records` revisions.
- **`provider-migrations`** — the only published version (`0.0.1-beta.0`) is
  an empty name-squatting placeholder; the real engine has never been
  released.
- **`react-native-passkey-autofill`** — `1.0.0-canary.23` is not on the
  registry (it stops at `canary.22`); see the section below for why this exact
  version is mandatory.

They are vendored as tarballs rather than referenced as `file:../…` directories
for two reasons:

- `pnpm pack` rewrites the workspace-only `catalog:` / `workspace:` specifiers in
  those manifests into concrete versions, which npm can resolve.
- npm installs a `file:` **directory** as a symlink, and Metro refuses to resolve
  a module whose real path lies outside the project root (it is not in
  `watchFolders`), so `expo export` / `expo start` fails. A tarball is extracted
  into `node_modules/` as a real directory and bundles normally.

Regenerate them after changing the keystore source (both repos are pinned to
their `feat/keystore-migrations` branches):

```bash
cd ../wallet-provider-extensions
pnpm install
pnpm run build
(cd keystore/react-native && pnpm pack --pack-destination ../../../ac2-wallet/vendor)
(cd migrations && pnpm pack --pack-destination ../../ac2-wallet/vendor)
cd ../ac2-wallet && pnpm install
```

`pnpm pack` names the tarball after the version in the package manifest, so a
version bump produces a _new_ file: update the matching `file:vendor/…tgz` specs
in `package.json` to the new names and delete the superseded tarballs, otherwise
npm keeps installing the old copy.

The `overrides` entries for `@algorandfoundation/react-native-keystore` and
`@algorandfoundation/provider-migrations` in `package.json` are mandatory: the
published `@algorandfoundation/keystore` meta package pins
`react-native-keystore@1.0.0-canary.14` — which on the registry is the WRONG
(pre-migrations) artifact — and the vendored `react-native-keystore` expects
`provider-migrations@0.0.0`, which the registry does not have. The overrides
point every such reference at this app's tarballs, so exactly one native
keystore module autolinks.

## `react-native-passkey-autofill`

Vendored for the same reason, but from the
[`react-native-passkey-autofill`](https://github.com/algorandfoundation/react-native-passkey-autofill)
repository. `1.0.0-canary.23` is the first version whose **native** side
(`KeystoreRecords` / `PasskeyCredentialStore`) writes credentials in the split
`k/<id>` + `m/<id>` MMKV record layout with `parentKeyId` / `derivationScheme`
metadata; anything older keeps writing legacy flat `<id>` records that stay
invisible after migration `0002-adopt-flat-records` has run once. Shipping
this version together with the migration is therefore mandatory.

```bash
cd ../react-native-passkey-autofill
pnpm install
pnpm run build
pnpm pack --pack-destination ../ac2-wallet/vendor
cd ../ac2-wallet && pnpm install
```

That module vendors the keystore tarballs itself, for its own example app and
tests. `.npmignore` keeps `vendor/` out of the pack, because a `file:` spec
relative to the module would otherwise install a SECOND copy of the native
keystore module; the `react-native-keystore` override above resolves its
keystore dependency to the same tarball this app uses.

Because the native sources come from the tarball, a version bump needs a
`prebuild`/native rebuild — reinstalling alone does not update an already-built
APK.

Once the packages are released, delete this directory, drop the overrides and
depend on the published versions instead.
