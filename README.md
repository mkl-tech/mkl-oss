# mkl-oss

Open source monorepo for software components built by the MKL Avocat company.

This repository exists to publish and maintain reusable technical packages that can live outside MKL Avocat's internal products.

GitHub repository: <https://github.com/mkl-tech/mkl-oss>

## Scope

`mkl-oss` is the public workspace for packages that are worth extracting from internal engineering work and maintaining as standalone open source modules.

## Workspace Layout

This repository uses a `pnpm` workspace.

```text
.
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── packages/
    └── storybook-addon-mcp-app/
```

Each publishable package lives under `packages/` and is versioned independently.

## Current Packages

### `@mkl-oss/storybook-addon-mcp-app`

A Storybook addon for mocking MCP App React integrations in local stories.

It is useful when you need to:

- simulate `@modelcontextprotocol/ext-apps` behavior in Storybook
- render React UIs that depend on an MCP host without running a real host
- replay common states such as `loading`, `result`, `empty`, `error`, and `cancelled`

Package documentation: [packages/storybook-addon-mcp-app/README.md](./packages/storybook-addon-mcp-app/README.md)

## npm Publishing Model

Packages are published with npm from this repository under the `@mkl-oss` scope.

Expected baseline for each package before publishing:

- a stable package name under the target npm scope
- a package-level `README.md` focused on installation and usage
- an explicit license
- a reproducible build
- complete npm metadata such as `repository`, `homepage`, `bugs`, `files`, and `publishConfig`
- automated validation and tests

## Local Development

Install dependencies:

```bash
pnpm install
```

Validate a package:

```bash
pnpm --filter <package-name> validate
```

Build a package:

```bash
pnpm --filter <package-name> build
```

Test a package:

```bash
pnpm --filter <package-name> test
```

## Open Source Guidelines

Packages published from this repository should be:

- reusable outside MKL Avocat
- documented for external developers
- free of secrets, internal data, and cabinet-specific business workflows
- maintainable as standalone packages

If a component cannot be cleanly documented, versioned, and supported as an external dependency, it probably does not belong in this repository.
