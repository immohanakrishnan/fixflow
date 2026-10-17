import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireSession } from "../../../lib/permissions";
import { requestSchema } from "../../../features/requests/request.schema";
import { audit } from "../../../lib/audit";
import { classifyRequest } from "../../../lib/request-classifier";

export async function GET(request: Request) {
  const auth = await requireSession();
  if ("response" in auth) return auth.response;
  const query = new URL(request.url).searchParams;
  const role = auth.session.user.role;
  if (query.get("summary") === "count") {
    if (role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({
      count: await prisma.maintenanceRequest.count({
        where: { deletedAt: null, ticket: null },
      }),
    });
  }
  const adminView = query.get("view") === "admin";
  if (adminView && role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const where =
    role === "TENANT"
      ? { createdById: auth.session.user.id }
      : role === "TECHNICIAN"
        ? {
            ticket: {
              deletedAt: null,
              assignments: {
                some: { technician: { userId: auth.session.user.id } },
              },
            },
          }
        : {};
  const requests = await prisma.maintenanceRequest.findMany({
      where: {
        ...where,
        deletedAt: null,
        ...(adminView ? { ticket: null } : {}),
      },
    orderBy: { submittedAt: "desc" },
    include: {
      property: true,
      unit: true,
      categoryRef: true,
      ticket: {
        include: {
          property: true,
          unit: true,
          assignments: {
            include: { technician: { include: { user: true } } },
          },
          ...(adminView
            ? {}
            : { history: { orderBy: { createdAt: "asc" as const } } }),
        },
      },
        attachments: true,
    },
  });
  return NextResponse.json(requests);
}
export async function POST(request: Request) {
  const auth = await requireSession(["ADMIN", "TENANT"]);
  if ("response" in auth) return auth.response;
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const input = parsed.data;
  if (auth.session.user.role === "TENANT") {
    const tenant = await prisma.tenant.findUnique({
      where: { userId: auth.session.user.id },
      select: { propertyId: true, unitId: true, status: true, deletedAt: true },
    });
    if (
      !tenant ||
      tenant.status !== "ACTIVE" ||
      tenant.deletedAt ||
      input.propertyId !== tenant.propertyId ||
      input.unitId !== tenant.unitId
    )
      return NextResponse.json(
        { error: "You may only submit a request for your assigned unit." },
        { status: 403 },
      );
  }
  const classification = await classifyRequest(input.title, input.description);
  const categoryRow = await prisma.category.findFirst({
    where: { name: classification.category, active: true },
  });
  const category = categoryRow?.name ?? "General";
  const priority = classification.priority;
  const created = await prisma.maintenanceRequest.create({
    data: {
      title: input.title,
      description: input.description,
      category,
      categoryId: categoryRow?.id,
      priority,
      status: "PENDING",
      propertyId: input.propertyId,
      unitId: input.unitId,
      createdById: auth.session.user.id,
      updatedById: auth.session.user.id,
      attachments: input.attachment ? { create: input.attachment } : undefined,
    },
    include: { property: true, unit: true, categoryRef: true, ticket: true },
  });
  await audit(
    "MaintenanceRequest",
    created.id,
    "CREATE",
    auth.session.user.id,
    undefined,
    created,
  );
  return NextResponse.json(created, { status: 201 });
}
