import bcrypt from 'bcryptjs';
import { invoices, customers, revenue, users } from '@/app/lib/placeholder-data'
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer: { id: string | number | boolean | Date | Uint8Array<ArrayBufferLike> | postgres.Helper<any, any[]> | postgres.Parameter<any> | postgres.ArrayParameter<readonly any[]> | readonly postgres.SerializableParameter<never>[] | postgres.Fragment | postgres.Fragment[] | null; name: string | number | boolean | Date | Uint8Array<ArrayBufferLike> | postgres.Helper<any, any[]> | postgres.Parameter<any> | postgres.ArrayParameter<readonly any[]> | readonly postgres.SerializableParameter<never>[] | postgres.Fragment | postgres.Fragment[] | null; email: string | number | boolean | Date | Uint8Array<ArrayBufferLike> | postgres.Helper<any, any[]> | postgres.Parameter<any> | postgres.ArrayParameter<readonly any[]> | readonly postgres.SerializableParameter<never>[] | postgres.Fragment | postgres.Fragment[] | null; image_url: string | number | boolean | Date | Uint8Array<ArrayBufferLike> | postgres.Helper<any, any[]> | postgres.Parameter<any> | postgres.ArrayParameter<readonly any[]> | readonly postgres.SerializableParameter<never>[] | postgres.Fragment | postgres.Fragment[] | null; }) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return new Response(JSON.stringify({ error: 'POSTGRES_URL is not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await sql.begin(async (sql) => {
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
    });
    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seeding failed:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}