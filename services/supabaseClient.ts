
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://wepjgvpmfbgbhziftokb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcGpndnBtZmJnYmh6aWZ0b2tiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyOTA0MzgsImV4cCI6MjA4MTg2NjQzOH0.c-JNZkh_IpLbPaGj5TKlzIXlVOXSKFh_-3_nOQtFuE0'; // Anon Key

export const supabase = createClient(supabaseUrl, supabaseKey);
