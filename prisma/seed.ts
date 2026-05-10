import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function hash(p: string) { return bcrypt.hash(p, 10); }

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@sirket.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sirket.com",
      password: await hash("Admin123!"),
      isAdmin: true,
      role: "Admin",
      color: "orange",
    },
  });

  const agents = [
    { name: "Ahmet Yılmaz", email: "ahmet@sirket.com", role: "Senior Agent", color: "blue" },
    { name: "Elif Kaya",    email: "elif@sirket.com",  role: "Agent",        color: "purple" },
    { name: "Mert Demir",   email: "mert@sirket.com",  role: "Agent",        color: "green" },
    { name: "Selin Arslan", email: "selin@sirket.com", role: "Junior Agent", color: "pink" },
    { name: "Can Öztürk",   email: "can@sirket.com",   role: "Team Lead",    color: "indigo" },
  ];

  for (const a of agents) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { ...a, password: await hash("Sifre123!"), isAdmin: false },
    });
  }

  const customers = [
    { email: "ali@musteri.com",    name: "Ali Yılmaz",    company: "Müşteri A.Ş.", phone: "+90 532 111 22 33", password: await hash("Musteri123!"), monthlyPrice: 5000 },
    { email: "zeynep@holding.com", name: "Zeynep Demir",  company: "Holding Group", phone: "+90 533 444 55 66", password: await hash("Musteri123!"), monthlyPrice: 12000 },
    { email: "devops@tech.co",     name: "Can Öztürk",    company: "Tech Co",       phone: null,               password: await hash("Musteri123!"), monthlyPrice: 3500 },
    { email: "selin@firma.net",    name: "Selin Arslan",  company: "Firma Net",     phone: null,               password: null,                      monthlyPrice: null },
    { email: "ik@kargo.net",       name: "IK Departmanı", company: "Kargo A.Ş.",   phone: null,               password: null,                      monthlyPrice: 2000 },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
  }

  const users = await prisma.user.findMany();
  const custs = await prisma.customer.findMany();
  const byEmail = (email: string) => custs.find(c => c.email === email)!;
  const agentByEmail = (email: string) => users.find(u => u.email === email)!;

  const tickets = [
    { subject: "Sunucu erişim sorunu", body: "SSH ile sunucuya bağlanamıyorum, port 22 kapalı görünüyor.", fromEmail: "ali@musteri.com", fromName: "Ali Yılmaz", category: "Teknik Destek", priority: "Kritik", assigneeId: agentByEmail("ahmet@sirket.com").id, customerId: byEmail("ali@musteri.com").id },
    { subject: "Fatura tutarsızlığı", body: "Kasım ayında fazla kesinti yapılmış, kontrol edilmesini istiyorum.", fromEmail: "zeynep@holding.com", fromName: "Zeynep Demir", category: "Fatura", priority: "Yüksek", assigneeId: agentByEmail("elif@sirket.com").id, customerId: byEmail("zeynep@holding.com").id },
    { subject: "Şifre sıfırlama çalışmıyor", body: "Mail gelmiyor, spam kutusunda da yok.", fromEmail: "selin@firma.net", fromName: "Selin Arslan", category: "Teknik Destek", priority: "Yüksek", assigneeId: agentByEmail("selin@sirket.com").id, customerId: byEmail("selin@firma.net").id },
    { subject: "API rate limit aşımı", body: "Dakikada 100 istek limitine takılıyoruz, artırılabilir mi?", fromEmail: "devops@tech.co", fromName: "Can Öztürk", category: "Teknik Destek", priority: "Kritik", assigneeId: agentByEmail("can@sirket.com").id, customerId: byEmail("devops@tech.co").id },
    { subject: "Eğitim materyali talebi", body: "Yeni çalışanlar için online eğitim videosu var mı?", fromEmail: "ik@kargo.net", fromName: "IK Departmanı", category: "Genel", priority: "Normal", assigneeId: null, customerId: byEmail("ik@kargo.net").id },
    { subject: "Fatura kopyası talebi", body: "2025 yılına ait tüm fatura kopyaları lazım.", fromEmail: "zeynep@holding.com", fromName: "Zeynep Demir", category: "Fatura", priority: "Normal", assigneeId: agentByEmail("ahmet@sirket.com").id, customerId: byEmail("zeynep@holding.com").id, status: "Yanıtlandı" },
    { subject: "Veri dışa aktarma hatası", body: "CSV export yaparken encoding bozuluyor, Türkçe karakterler kaçıyor.", fromEmail: "ali@musteri.com", fromName: "Ali Yılmaz", category: "Teknik Destek", priority: "Yüksek", assigneeId: agentByEmail("elif@sirket.com").id, customerId: byEmail("ali@musteri.com").id },
    { subject: "Yeni IP adresi bildirimi", body: "Güvenlik duvarı için yeni IP adreslerimizi bildiriyoruz.", fromEmail: "devops@tech.co", fromName: "Can Öztürk", category: "Genel", priority: "Normal", assigneeId: agentByEmail("mert@sirket.com").id, customerId: byEmail("devops@tech.co").id, status: "Kapalı" },
  ];

  for (const t of tickets) {
    await prisma.ticket.create({ data: { ...t, status: (t as { status?: string }).status ?? "Yeni" } });
  }

  console.log("Seed tamamlandı.");
  console.log("Admin:   admin@sirket.com / Admin123!");
  console.log("Agent:   ahmet@sirket.com / Sifre123!");
  console.log("Müşteri: ali@musteri.com  / Musteri123!");
}

main().finally(() => prisma.$disconnect());
