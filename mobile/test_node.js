const url = "https://gmgilaahgmqagtskkhdz.supabase.co/rest/v1/";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw";

async function run() {
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  
  const schedulesRes = await fetch(url + "doctor_schedules?select=*", { headers });
  const schedules = await schedulesRes.json();
  console.log("doctor_schedules:", schedules);

  const docSucRes = await fetch(url + "doctor_sucursal?select=*", { headers });
  const docSuc = await docSucRes.json();
  console.log("doctor_sucursal:", docSuc);
}

run();
