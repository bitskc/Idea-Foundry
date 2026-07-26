import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || process.env.ideas_DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('Set DATABASE_URL (or ideas_DATABASE_URL / POSTGRES_URL) in your environment');
  process.exit(1);
}

console.log('Testing database connection...');

try {
  // Try with default settings first
  const client = postgres(connectionString, {
    connect_timeout: 30,
    idle_timeout: 30,
  });
  
  const result = await client`SELECT version(), current_database()`;
  console.log('✅ Connected successfully!');
  console.log('PostgreSQL version:', result[0].version);
  console.log('Database:', result[0].current_database);
  
  await client.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('Error code:', error.code);
  process.exit(1);
}
