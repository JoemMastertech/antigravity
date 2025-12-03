
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udtlqjmrtbcpdqknwuro.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdGxxam1ydGJjcGRxa253dXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDYyNzQsImV4cCI6MjA1ODUyMjI3NH0.5UW6IHyGVFfX5bnr5kv1XFIvevVxWvBoBy2a7_0visU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const tables = ['tequila', 'licores', 'productos', 'Tequila', 'Tequilas'];

    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`Error checking ${table}: ${error.message}`);
        } else {
            console.log(`SUCCESS! Found table: ${table}`);
            if (data && data.length > 0) {
                console.log('Keys:', Object.keys(data[0]));
                console.log('Sample Row:', data[0]);
            } else {
                console.log('Table is empty.');
            }
            return; // Stop after finding the first match
        }
    }
}

inspect();
