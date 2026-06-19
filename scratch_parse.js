function parseEWKBPoint(hexStr) {
  if (!hexStr || hexStr.length < 42) return null;
  // PostGIS EWKB Point with SRID is usually 50 hex chars (25 bytes)
  // Byte 0: Endianness (00 = Big, 01 = Little)
  const isLittleEndian = hexStr.substring(0, 2) === '01';
  
  // Bytes 1-4: Type (Point is 1, plus 0x20000000 for SRID)
  // Bytes 5-8: SRID (usually 4326)
  
  // Bytes 9-16: X (Longitude) float64
  // Bytes 17-24: Y (Latitude) float64
  
  // If it's a standard EWKB point with SRID, X starts at byte offset 9 (char offset 18)
  // If it's a standard WKB point WITHOUT SRID, X starts at byte offset 5 (char offset 10)
  
  // Let's just reliably parse the last 32 chars (16 bytes) as two Float64s
  const xHex = hexStr.slice(-32, -16);
  const yHex = hexStr.slice(-16);
  
  const getFloat64 = (hex) => {
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    const view = new DataView(bytes.buffer);
    return view.getFloat64(0, isLittleEndian);
  };
  
  const lng = getFloat64(xHex);
  const lat = getFloat64(yHex);
  return { lng, lat };
}

console.log(parseEWKBPoint('0101000020E6100000E78C28ED0D6653405396218E75F12940'));
