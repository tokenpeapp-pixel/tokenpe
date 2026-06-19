async function test() {
  try {
    const res = await fetch("https://tokenpe.online/api/clinics/nearby?lat=19.0330&lng=73.0297&radius=50000");
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();
