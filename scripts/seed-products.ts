/**
 * Siembra productos iniciales en Neon — Via B local fallback.
 *
 * Uso:
 *   DATABASE_URL="postgresql://...-pooler...?sslmode=require" npx tsx scripts/seed-products.ts
 *   DATABASE_URL="..." npx tsx scripts/seed-products.ts --force   # re-sembrar aunque haya productos
 *
 * No expone DATABASE_URL ni contenido: solo logs con counts.
 */
async function main() {
  const force = process.argv.includes('--force');
  // Forzar driver postgres para este proceso
  process.env.STORE_DRIVER = 'postgres';
  const { resetStore, getStore } = await import('../src/lib/store');
  resetStore();
  const store = getStore();
  const { initialProducts } = await import('../src/lib/product-data');

  const before = await store.getProducts();
  console.log(`Productos antes: ${before.length}`);
  if (before.length > 0 && !force) {
    console.log('ℹ️  Ya hay productos. Usa --force para re-sembrar.');
    return;
  }

  await store.setProducts(initialProducts as never);
  const after = await store.getProducts();
  console.log(`✅ Productos sembrados: ${after.length} (antes ${before.length})`);
}

main().catch((err) => {
  console.error('❌ Error al sembrar productos:', err instanceof Error ? err.message : err);
  process.exit(1);
});
