const url = "https://gmgilaahgmqagtskkhdz.supabase.co/rest/v1/";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ2lsYWFoZ21xYWd0c2traGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTkxOTIsImV4cCI6MjA4OTY3NTE5Mn0.MMo76MDD8p-rUzbkAHUqd9L4huFgVIFsXN84XW_02zw";
const headers = { 
  apikey: key, 
  Authorization: "Bearer " + key, 
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};
const headersUpsert = { ...headers, "Prefer": "resolution=ignore-duplicates,return=representation" };

async function seed() {
  try {
    console.log("1. Insertando Clínica Central...");
    await fetch(url + "sucursales", {
      method: "POST",
      headers: headersUpsert,
      body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        name: "Clínica Sede Central",
        address: "Av. Principal, La Paz",
        coordinates: "-16.5, -68.15"
      })
    });

    console.log("2. Obteniendo Doctores...");
    const profRes = await fetch(url + "profiles?select=id&role=eq.medico", { headers });
    const doctors = await profRes.json();
    console.log("Encontrados " + doctors.length + " doctores.");

    const docSucursalData = doctors.map(doc => ({
      doctor_id: doc.id,
      sucursal_id: "00000000-0000-0000-0000-000000000001"
    }));

    if (docSucursalData.length > 0) {
      console.log("3. Vinculando doctores a la clínica...");
      await fetch(url + "doctor_sucursal", {
        method: "POST",
        headers: headersUpsert,
        body: JSON.stringify(docSucursalData)
      });

      console.log("4. Generando horarios de Lunes a Domingo para todos...");
      const schedules = [];
      for (const doc of doctors) {
        for (let dia = 1; dia <= 7; dia++) {
          schedules.push({
            doctor_id: doc.id,
            sucursal_id: "00000000-0000-0000-0000-000000000001",
            day_of_week: dia,
            start_time: "09:00:00",
            end_time: "17:00:00",
            slot_duration_minutes: 30,
            is_active: true
          });
        }
      }
      
      const chunk = 50;
      for (let i = 0; i < schedules.length; i += chunk) {
        await fetch(url + "doctor_schedules", {
          method: "POST",
          headers: headersUpsert,
          body: JSON.stringify(schedules.slice(i, i + chunk))
        });
      }
    }
    
    console.log("✅ Seed completado con éxito! Prueba la app móvil ahora.");
  } catch (err) {
    console.error("Error:", err);
  }
}

seed();
