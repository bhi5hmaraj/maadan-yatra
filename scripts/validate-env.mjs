import { config } from 'dotenv';
import { getInsuranceEnvironmentStatus } from '../lib/insurance-env.mjs';

config({ path: '.env.local' });
config({ path: '.env' });

const status = getInsuranceEnvironmentStatus(process.env);

if (!status.ok) {
  console.error('Insurance environment validation failed:');

  for (const issue of status.issues) {
    console.error(`- ${issue.key}: ${issue.message}`);
  }

  process.exit(1);
}

console.log('Insurance environment validation passed.');
