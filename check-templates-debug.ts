
import { db } from './db';
import { emailTemplates } from './db/schema';
import { eq } from 'drizzle-orm';

async function checkTemplates() {
  console.log('Checking email templates...');
  
  const templates = await db.select().from(emailTemplates);
  
  console.log(`Found ${templates.length} templates.`);
  
  const verificationTemplate = templates.find(t => t.type === 'email_verification');
  
  if (verificationTemplate) {
    console.log('✅ Verification template found:');
    console.log(`- ID: ${verificationTemplate.id}`);
    console.log(`- Name: ${verificationTemplate.name}`);
    console.log(`- Subject: ${verificationTemplate.subject}`);
    console.log(`- Active: ${verificationTemplate.isActive}`);
  } else {
    console.error('❌ Verification template NOT found!');
  }

  const registrationTemplate = templates.find(t => t.type === 'registration');
    if (registrationTemplate) {
    console.log('✅ Registration template found:');
    console.log(`- ID: ${registrationTemplate.id}`);
    console.log(`- Name: ${registrationTemplate.name}`);
    console.log(`- Subject: ${registrationTemplate.subject}`);
    console.log(`- Active: ${registrationTemplate.isActive}`);
  } else {
    console.error('❌ Registration template NOT found!');
  }
}

checkTemplates().catch(console.error).finally(() => process.exit(0));
