import { prisma } from "./prisma";

export async function audit(
  entity: string,
  entityId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  actorId: string | undefined,
  before?: unknown,
  after?: unknown,
) {
  try {
    const actor = actorId
      ? await prisma.user.findUnique({
          where: { id: actorId },
          select: { id: true },
        })
      : null;
    await (prisma as any).auditLog.create({
      data: {
        entity,
        entityId,
        action,
        actorId: actor?.id ?? null,
        before:
          before === undefined ? undefined : JSON.parse(JSON.stringify(before)),
        after:
          after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
      },
    });
  } catch (error) {
    console.error("Audit logging failed", error);
  }
}
