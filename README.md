# @long-dk/auth-db

[![Release](https://github.com/long-dk/auth-db/actions/workflows/release.yml/badge.svg)](https://github.com/long-dk/auth-db/actions/workflows/release.yml)
[![npm](https://img.shields.io/badge/npm-GitHub%20Packages-blue)](https://github.com/long-dk/auth-db/packages)

ORM-agnostic database package for the auth domain. Exposes a repository interface (`IUserRepository`) backed by Prisma internally. Apps and workers import only the interface — never `PrismaClient` directly — so the underlying ORM can be swapped without touching any service.

## Schema

```prisma
model User {
  id          String    @id @default(uuid())
  email       String    @unique
  password    String?
  firstName   String?
  lastName    String?
  avatar      String?
  isVerified  Boolean   @default(false)
  phoneNumber String?
  role        Role
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
}

enum Role {
  ADMIN
  USER
}
```

## Installation

```bash
# Requires GitHub Packages auth — ensure ~/.npmrc contains:
# @long-dk:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT

npm install @long-dk/auth-db
```

## Usage

```typescript
import { createAuthDbManager, IAuthDbManager, IUserRepository } from '@long-dk/auth-db';

// In your NestJS module
const dbManager: IAuthDbManager = createAuthDbManager(process.env.DATABASE_URL);
const userRepository: IUserRepository = dbManager.userRepository;

// Use the repository
const user = await userRepository.findOne({ email: 'user@example.com' });
const created = await userRepository.create({ email: 'new@example.com', role: 'USER' });
```

## Public API

```typescript
// Factory
createAuthDbManager(databaseUrl: string): IAuthDbManager
resetAuthDbManager(): void

// Interfaces (type-only imports)
IAuthDbManager
IUserRepository
CreateUserInput
UpdateUserInput
User
PaginatedResult<T>
QueryOptions

// Enum (value export)
Role   // 'USER' | 'ADMIN'
```

## Repository Interface

`IUserRepository` extends base operations:

| Method | Description |
|---|---|
| `findById(id)` | Find user by UUID |
| `findOne(filter)` | Find single user by filter |
| `findMany(options)` | Paginated user list with search/filter |
| `create(input)` | Create new user |
| `update(id, input)` | Update user fields |
| `softDelete(id)` | Set `deletedAt` timestamp |

All `findMany` queries automatically filter `deletedAt: null`.

## Database Migrations

Migrations are owned by this package. **Never add a `schema.prisma` in your app.**

```bash
npm run prisma:migrate     # prisma migrate dev
npm run prisma:generate    # regenerate Prisma client
npm run prisma:studio      # open Prisma Studio
```

## Versioning

| Change | Version bump |
|---|---|
| Schema change | Minor |
| Breaking interface change | Major |
| Bug fix / non-breaking | Patch |

Apps and their paired worker must always pin to the **same version range**.

## Publishing

Releases are triggered via `workflow_dispatch` on the GitHub Actions release workflow. The package is published to GitHub Packages under `@long-dk`.

## Scripts

```bash
npm run build            # tsc → dist/
npm run lint             # ESLint --fix
npm run format           # Prettier --write
npm test                 # Unit tests (100% coverage enforced)
npm run version:patch    # Bump patch version
npm run version:minor    # Bump minor version
npm run version:major    # Bump major version
```

## License

[MIT](LICENSE)
