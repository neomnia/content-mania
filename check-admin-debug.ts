import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function checkAdmin() {
  const adminEmail = 'admin@exemple.com';
  const user = await db.query.users.findFirst({
    where: eq(users.email, adminEmail)
  });

  console.log('User found:', user);
  if (user) {
    console.log('Phone:', user.phone);
    console.log('FirstName:', user.firstName);
    console.log('LastName:', user.lastName);
  }
}

checkAdmin().then(() => process.exit(0));
