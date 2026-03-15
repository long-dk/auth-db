import { UserRepository } from "../../src/repositories/user.repository";
import { PrismaClient } from "@prisma/client";
import * as ops from "../../src/operations/base.operations";

jest.mock("../../src/operations/base.operations");

const mockOps = ops as jest.Mocked<typeof ops>;

function makeClient() {
  return {} as unknown as PrismaClient;
}

describe("UserRepository", () => {
  let repo: UserRepository;
  let client: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = makeClient();
    repo = new UserRepository(client);
  });

  it("findById delegates to findById op", async () => {
    mockOps.findById.mockResolvedValue({ id: "1" } as any);
    const result = await repo.findById("1");
    expect(mockOps.findById).toHaveBeenCalledWith(client, "user", "1");
    expect(result).toEqual({ id: "1" });
  });

  it("findByEmail delegates to findOne op", async () => {
    mockOps.findOne.mockResolvedValue({ id: "2" } as any);
    const result = await repo.findByEmail("a@b.com");
    expect(mockOps.findOne).toHaveBeenCalledWith(client, "user", { email: "a@b.com" });
    expect(result).toEqual({ id: "2" });
  });

  it("findOne delegates to findOne op with filter", async () => {
    mockOps.findOne.mockResolvedValue(null);
    await repo.findOne({ email: "x@y.com" });
    expect(mockOps.findOne).toHaveBeenCalledWith(client, "user", { email: "x@y.com" });
  });

  it("findMany adds default searchFields", async () => {
    mockOps.findMany.mockResolvedValue({ items: [], meta: {} } as any);
    await repo.findMany({});
    const opts = mockOps.findMany.mock.calls[0][2];
    expect(opts.searchFields).toEqual(["email", "firstName", "lastName"]);
  });

  it("findMany preserves provided searchFields", async () => {
    mockOps.findMany.mockResolvedValue({ items: [], meta: {} } as any);
    await repo.findMany({ searchFields: ["firstName"] });
    const opts = mockOps.findMany.mock.calls[0][2];
    expect(opts.searchFields).toEqual(["firstName"]);
  });

  it("create delegates to createRecord op", async () => {
    mockOps.createRecord.mockResolvedValue({ id: "3" } as any);
    const input = { email: "a@b.com", role: "USER" as any };
    await repo.create(input);
    expect(mockOps.createRecord).toHaveBeenCalledWith(client, "user", input);
  });

  it("update delegates to updateRecord op", async () => {
    mockOps.updateRecord.mockResolvedValue({ id: "1" } as any);
    const input = { email: "new@b.com" };
    await repo.update("1", input);
    expect(mockOps.updateRecord).toHaveBeenCalledWith(client, "user", "1", input);
  });

  it("softDelete delegates to softDelete op", async () => {
    mockOps.softDelete.mockResolvedValue({ id: "1" } as any);
    await repo.softDelete("1");
    expect(mockOps.softDelete).toHaveBeenCalledWith(client, "user", "1");
  });

  it("count delegates to countRecords op", async () => {
    mockOps.countRecords.mockResolvedValue(7);
    const result = await repo.count({ role: "ADMIN" as any });
    expect(mockOps.countRecords).toHaveBeenCalledWith(client, "user", { role: "ADMIN" });
    expect(result).toBe(7);
  });

  it("count with no filter passes undefined", async () => {
    mockOps.countRecords.mockResolvedValue(0);
    await repo.count();
    expect(mockOps.countRecords).toHaveBeenCalledWith(client, "user", undefined);
  });
});
