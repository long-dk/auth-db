import {
  findById,
  findOne,
  findMany,
  createRecord,
  updateRecord,
  softDelete,
  countRecords,
} from "../../src/operations/base.operations";
import { PrismaClient } from "@prisma/client";

function makeAccessor(overrides: Record<string, jest.Mock> = {}) {
  return {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    ...overrides,
  };
}

function makeClient(accessor: ReturnType<typeof makeAccessor>) {
  return { user: accessor } as unknown as PrismaClient;
}

describe("findById", () => {
  it("calls findFirst with id and deletedAt filter", async () => {
    const acc = makeAccessor({ findFirst: jest.fn().mockResolvedValue({ id: "1" }) });
    const result = await findById(makeClient(acc), "user", "1");
    expect(acc.findFirst).toHaveBeenCalledWith({ where: { id: "1", deletedAt: null } });
    expect(result).toEqual({ id: "1" });
  });

  it("returns null when not found", async () => {
    const acc = makeAccessor({ findFirst: jest.fn().mockResolvedValue(null) });
    const result = await findById(makeClient(acc), "user", "999");
    expect(result).toBeNull();
  });
});

describe("findOne", () => {
  it("merges filter with deletedAt null", async () => {
    const acc = makeAccessor({ findFirst: jest.fn().mockResolvedValue({ id: "1" }) });
    await findOne(makeClient(acc), "user", { email: "a@b.com" });
    expect(acc.findFirst).toHaveBeenCalledWith({
      where: { email: "a@b.com", deletedAt: null },
    });
  });
});

describe("findMany", () => {
  it("paginates with defaults", async () => {
    const items = [{ id: "1" }];
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue(items),
      count: jest.fn().mockResolvedValue(1),
    });
    const result = await findMany(makeClient(acc), "user", {});
    expect(result.items).toEqual(items);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it("applies search when searchFields provided", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { search: "foo", searchFields: ["email"] });
    const call = acc.findMany.mock.calls[0][0];
    expect(call.where["OR"]).toEqual([{ email: { contains: "foo", mode: "insensitive" } }]);
  });

  it("does not add OR when search is empty", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { searchFields: ["email"] });
    const call = acc.findMany.mock.calls[0][0];
    expect(call.where["OR"]).toBeUndefined();
  });

  it("caps limit at 100", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { limit: 999 });
    expect(acc.findMany.mock.calls[0][0].take).toBe(100);
  });

  it("includes relations when provided", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { relations: ["profile"] });
    const call = acc.findMany.mock.calls[0][0];
    expect(call.include).toEqual({ profile: true });
  });

  it("handles nested dot relations", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { relations: ["profile.address"] });
    const call = acc.findMany.mock.calls[0][0];
    expect(call.include).toEqual({ profile: { include: { address: true } } });
  });

  it("sets totalPages to 1 when total is 0", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const result = await findMany(makeClient(acc), "user", {});
    expect(result.meta.totalPages).toBe(1);
  });

  it("sets hasNextPage true when more pages exist", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(25),
    });
    const result = await findMany(makeClient(acc), "user", { page: 1, limit: 10 });
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it("sets hasPreviousPage true when on page 2+", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(25),
    });
    const result = await findMany(makeClient(acc), "user", { page: 2, limit: 10 });
    expect(result.meta.hasPreviousPage).toBe(true);
  });

  it("applies customFilters", async () => {
    const acc = makeAccessor({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    await findMany(makeClient(acc), "user", { customFilters: { role: "ADMIN" } });
    const call = acc.findMany.mock.calls[0][0];
    expect(call.where.role).toBe("ADMIN");
  });
});

describe("createRecord", () => {
  it("calls create with data", async () => {
    const acc = makeAccessor({ create: jest.fn().mockResolvedValue({ id: "1" }) });
    const result = await createRecord(makeClient(acc), "user", { email: "a@b.com" });
    expect(acc.create).toHaveBeenCalledWith({ data: { email: "a@b.com" } });
    expect(result).toEqual({ id: "1" });
  });
});

describe("updateRecord", () => {
  it("calls update with id and data", async () => {
    const acc = makeAccessor({ update: jest.fn().mockResolvedValue({ id: "1" }) });
    await updateRecord(makeClient(acc), "user", "1", { email: "b@c.com" });
    expect(acc.update).toHaveBeenCalledWith({ where: { id: "1" }, data: { email: "b@c.com" } });
  });
});

describe("softDelete", () => {
  it("sets deletedAt on the record", async () => {
    const acc = makeAccessor({ update: jest.fn().mockResolvedValue({ id: "1" }) });
    await softDelete(makeClient(acc), "user", "1");
    const call = acc.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "1" });
    expect(call.data.deletedAt).toBeInstanceOf(Date);
  });
});

describe("countRecords", () => {
  it("counts with deletedAt filter", async () => {
    const acc = makeAccessor({ count: jest.fn().mockResolvedValue(5) });
    const result = await countRecords(makeClient(acc), "user");
    expect(acc.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
    expect(result).toBe(5);
  });

  it("merges additional filters", async () => {
    const acc = makeAccessor({ count: jest.fn().mockResolvedValue(2) });
    await countRecords(makeClient(acc), "user", { role: "ADMIN" });
    expect(acc.count).toHaveBeenCalledWith({ where: { deletedAt: null, role: "ADMIN" } });
  });
});
