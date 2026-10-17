import { PrismaClient, Role, Priority } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient() as any;
const properties = [
  "Al Noor Residences",
  "The Boulevard Villas",
  "Wadi Heights",
  "Palm Gate Apartments",
  "Riyadh Central Lofts",
];
const categories = ["HVAC", "Plumbing", "Electrical", "Lift", "General"];
const issueCatalog: Array<[string, string, Priority]> = [
  ["AC not cooling during extreme heat", "HVAC", Priority.EMERGENCY],
  ["Heavy water leak under kitchen sink", "Plumbing", Priority.HIGH],
  ["Electrical socket sparking", "Electrical", Priority.HIGH],
  ["Elevator stops between floors", "Lift", Priority.HIGH],
  ["Broken bedroom door lock", "General", Priority.LOW],
  ["Kitchen drainage blockage", "Plumbing", Priority.MEDIUM],
  ["Water heater is not heating", "HVAC", Priority.MEDIUM],
  ["Bathroom exhaust fan is noisy", "Electrical", Priority.LOW],
];

async function main() {
  await prisma.ticketComment.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.ticketAssignment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.technicianSkill.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.tenantOccupancy.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await (prisma as any).auditLog.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Ahmed Khalid",
      email: "admin@fixflow.demo",
      passwordHash: hashPassword("demo1234"),
      role: Role.ADMIN,
    },
  });
  const categoryRows = await Promise.all(
    categories.map((name) =>
      prisma.category.create({
        data: { name, description: `${name} maintenance requests` },
      }),
    ),
  );
  const categoryMap = new Map(
    categoryRows.map((category: any) => [category.name, category.id]),
  );
  const tenants = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      prisma.user.create({
        data: {
          name: `Demo Tenant ${i + 1}`,
          email: `tenant${i + 1}@fixflow.demo`,
          passwordHash: hashPassword("demo1234"),
          role: Role.TENANT,
        },
      }),
    ),
  );
  const technicians = [];
  const techNames = [
    "Omar Al-Harbi",
    "Mansour Al-Qahtani",
    "Yousef Ahmed",
    "Fahad Saleh",
    "Salem Nasser",
    "Khalid Omar",
    "Hassan Ali",
    "Nasser Saad",
  ];
  for (let i = 0; i < techNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        name: techNames[i],
        email: `tech${i + 1}@fixflow.demo`,
        passwordHash: hashPassword("demo1234"),
        role: Role.TECHNICIAN,
      },
    });
    const primarySkill = i % 2 ? "Plumbing" : "HVAC";
    technicians.push(
      await prisma.technicianProfile.create({
        data: {
          userId: user.id,
          phone: `+966 50 555 ${1000 + i}`,
          skills: {
            create: [
              { name: primarySkill, categoryId: categoryMap.get(primarySkill) },
              { name: "General", categoryId: categoryMap.get("General") },
            ],
          },
        },
      }),
    );
  }
  for (let i = 0; i < properties.length; i++) {
    await prisma.property.create({
      data: {
        name: properties[i],
        address: [
          "King Fahd Road",
          "Prince Turki Street",
          "Olaya Avenue",
          "Tahlia Street",
          "Imam Saud Road",
        ][i],
        units: {
          create: Array.from({ length: 5 }, (_, u) => ({
            label: `Apt ${101 + i * 100 + u}`,
          })),
        },
      },
    });
  }
  const units = await prisma.unit.findMany();
  for (let i = 0; i < 12; i++) {
    const unit = units[i % units.length];
    const tenant = await prisma.tenant.create({
      data: {
        userId: tenants[i].id,
        propertyId: unit.propertyId,
        unitId: unit.id,
      },
    });
    await prisma.tenantOccupancy.create({
      data: { userId: tenants[i].id, unitId: unit.id, tenantId: tenant.id },
    });
  }
  for (let i = 0; i < 40; i++) {
    const [issue, category, priority] = issueCatalog[i % issueCatalog.length];
    const unit = units[i % units.length];
    const request = await prisma.maintenanceRequest.create({
      data: {
        title: issue,
        description: `Fictional demo report for ${issue.toLowerCase()}. Please investigate and update the resident.`,
        category,
        categoryId: categoryMap.get(category),
        priority,
        status: "PENDING",
        propertyId: unit.propertyId,
        unitId: unit.id,
        createdById: i < 12 ? tenants[i]!.id : admin.id,
      },
    });
  }
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "Demo workspace ready",
      body: "40 fictional maintenance requests were seeded for review.",
    },
  });
  console.log(
    "Seeded 5 properties, 25 units, 12 tenants, 8 technicians, and 40 fictional maintenance requests.",
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
