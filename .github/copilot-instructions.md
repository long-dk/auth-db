# Copilot Instructions – @long-dk/auth-db

## Overview

Shared npm package published to **GitHub Packages** (`@long-dk/auth-db`). Owns the **User and Role Prisma schema**, all database migrations, and exposes an **ORM-agnostic repository interface** so `auth-service` and `auth-worker` never import `PrismaClient` directly.

Both `auth-service` and `auth-worker` must always pin to the **same version range** of this package.

## Versioning Rules

| Change type                          | Version bump |
| ------------------------------------ | ------------ |
| Schema change (new field, new model) | **minor**    |
| Breaking interface change            | **major**    |
| Internal Prisma query fix            | **patch**    |

## Developer Workflows

Run all commands from the `packages/auth-db/` directory:

```bash
npm run prisma:migrate   # dotenv -e .env -- prisma migrate dev
npm run prisma:generate  # regenerates Prisma client from schema
npm run prisma:studio    # opens Prisma Studio against the auth DB
npm run build            # tsc compile → dist/ (run before publishing)
npm publish              # publishes to GitHub Packages (requires GITHUB_TOKEN)
```

## ORM-Agnostic Design

The package exposes interfaces, not Prisma types. Apps interact only with the public API:

```typescript
import { createAuthDbManager, IAuthDbManager, IUserRepository } from "@long-dk/auth-db";

// Wire up once at module init (NestJS provider factory)
const dbManager: IAuthDbManager = createAuthDbManager(process.env.DATABASE_URL);

// Inject IUserRepository in services — never PrismaClient
const user = await dbManager.userRepository.findById(userId);
```

### Swapping the ORM

To replace Prisma with TypeORM or Drizzle:

1. Replace `src/client/prisma.client.ts` with the new client factory
2. Replace `src/repositories/user.repository.ts` with a new implementation of `IUserRepository`
3. **Do not touch** `src/interfaces/` or `src/index.ts` — the contract stays the same
4. Run `npm run build` and bump the package version

## Schema Ownership

`prisma/schema.prisma` is the **single source of truth** for the auth database. No app or worker has its own `schema.prisma`.

Current schema covers:

- `User` — id (UUID), email, password (hashed), firstName, lastName, role, deletedAt?, createdAt, updatedAt
- `Role` enum — `ADMIN | USER`

### Running a migration

```bash
# From packages/auth-db/
npm run prisma:migrate   # prompts for migration name, applies to dev DB
```

Always bump the package **minor version** after a schema change and update both `auth-service` and `auth-worker` to the new version.

## Public API (`src/index.ts`)

```typescript
export { IAuthDbManager } from "./interfaces/db-manager.interface";
export { IUserRepository } from "./interfaces/user.repository.interface";
export { createAuthDbManager } from "./client/prisma.client";
```

Never export `PrismaClient`, raw Prisma types, or implementation details.

## Folder Structure

```
packages/auth-db/
  prisma/
    schema.prisma               # User + Role — source of truth for auth DB
    migrations/                 # All auth DB migrations — never edit manually
  src/
    client/
      prisma.client.ts          # PrismaClient singleton + createAuthDbManager() factory
    interfaces/
      user.repository.interface.ts  # IUserRepository — ORM-agnostic CRUD contract
      db-manager.interface.ts       # IAuthDbManager { userRepository: IUserRepository }
    repositories/
      user.repository.ts        # Concrete Prisma implementation of IUserRepository
    operations/
      base.operations.ts        # Generic helpers: findById, findOne, findMany,
                                #   create, update, softDelete (sets deletedAt)
    index.ts                    # Public API — ONLY thing consumers should import from
  package.json                  # name: "@long-dk/auth-db", "main": "dist/index.js"
  tsconfig.json                 # Compiles src/ → dist/
```

## IUserRepository Interface Contract

```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findOne(filter: Partial<User>): Promise<User | null>;
  findMany(options: QueryOptions): Promise<PaginatedResult<User>>;
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<User>; // sets deletedAt: new Date()
}
```

All methods treat `deletedAt: null` as the baseline — soft-deleted records are never returned unless explicitly queried.

## Testing Conventions

- Unit tests in `test/unit/` with 100% coverage on `*.repository.ts` and `*.operations.ts`
- Mock `PrismaClient` at the method level: `prisma.user.findUnique = jest.fn()`
- Integration tests (if any) run against a real Docker Postgres — never the production DB
