import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
);

async function testConnection() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (error?.code === '42P01') {
    console.log('STATUS: tables_missing — connection OK');
  } else if (error) {
    console.log('STATUS: error —', error.message, '| code:', error.code);
  } else {
    console.log('STATUS: profiles_exists — rows:', data?.length);
  }
  process.exit(0);
}

testConnection().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
