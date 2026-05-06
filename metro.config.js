const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Habilita resolução do campo "exports" no package.json
// Necessário para @supabase/supabase-js e seus sub-pacotes (postgrest-js, etc.)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
