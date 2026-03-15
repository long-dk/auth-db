import { createAuthDbManager, resetAuthDbManager } from "../../src/client/prisma.client";

jest.mock("@prisma/client", () => {
  const disconnect = jest.fn().mockResolvedValue(undefined);
  const MockPrismaClient = jest.fn().mockImplementation(() => ({
    $disconnect: disconnect,
    user: {},
  }));
  return { PrismaClient: MockPrismaClient };
});

jest.mock("../../src/repositories/user.repository", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({})),
}));

describe("createAuthDbManager", () => {
  beforeEach(() => {
    resetAuthDbManager();
  });

  it("creates a new instance on first call", () => {
    const manager = createAuthDbManager("postgresql://test");
    expect(manager).toBeDefined();
    expect(manager.userRepository).toBeDefined();
  });

  it("returns the same singleton on subsequent calls", () => {
    const m1 = createAuthDbManager("postgresql://test");
    const m2 = createAuthDbManager("postgresql://other");
    expect(m1).toBe(m2);
  });

  it("resetAuthDbManager clears the singleton", () => {
    const m1 = createAuthDbManager("postgresql://test");
    resetAuthDbManager();
    const m2 = createAuthDbManager("postgresql://test");
    expect(m1).not.toBe(m2);
  });

  it("disconnect calls prisma.$disconnect", async () => {
    const manager = createAuthDbManager("postgresql://test");
    await expect(manager.disconnect()).resolves.toBeUndefined();
  });
});
