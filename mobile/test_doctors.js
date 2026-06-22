const url = "https://gmgilaahgmqagtskkhdz.supabase.co/rest/v1/";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw";

async function run() {
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  const profRes = await fetch(url + "profiles?select=id,full_name&role=eq.medico", { headers });
  const profs = await profRes.json();
  console.log("medicos:", profs);
}
run();
