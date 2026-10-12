# Gold'n Era Barbershop

Website and booking platform for Gold'n Era Barbershop, a booth-rent shop in Moreno Valley, CA. Built by ProlificX.

## Stack
- Supabase: database, auth, storage
- Cloudflare: hosting
- GitHub: source control

## Supabase
- Org: Gold'n Era Barbershop (Free)
- Project ref: `jwjjiupvbeasqgvcnjyi`
- URL: https://jwjjiupvbeasqgvcnjyi.supabase.co
- Region: us-west-2 (Oregon)
- GitHub integration: migrations in `supabase/` deploy on push to the production branch

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
npm run preview    # build + run the Cloudflare Worker locally
```

Shop content (locations, barbers, reviews) lives in `src/lib/shop.ts`. Entries marked `sample: true` are placeholders to replace before launch.

## Deploy (Cloudflare Workers Builds)
- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Worker name: `gold-n-era-barbershop` (must match `wrangler.jsonc`)
