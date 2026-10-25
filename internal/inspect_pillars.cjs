const fs = require('fs');

const pillars = [
  { name: '梯子/连接专题 (VPN/Tizi)', path: 'connection/index.html', url: 'https://netzhenduan.cc/connection/' },
  { name: '机场推荐/品牌库 (Jichang/Brands)', path: 'airports/index.html', url: 'https://netzhenduan.cc/airports/' },
  { name: '客户端手册 (Clash/Clients)', path: 'clients/index.html', url: 'https://netzhenduan.cc/clients/' },
  { name: '网络诊断工具 (Nodes/Diagnostics)', path: 'diagnostics/index.html', url: 'https://netzhenduan.cc/diagnostics/' },
  { name: '免费资源与风险 (Free)', path: 'free/index.html', url: 'https://netzhenduan.cc/free/' },
  { name: '使用教程手册 (Tutorials)', path: 'tutorials/index.html', url: 'https://netzhenduan.cc/tutorials/' },
  { name: '科学上网故障排查 (Issues)', path: 'issues/index.html', url: 'https://netzhenduan.cc/issues/' },
  { name: '机场订阅排障 (Subscription)', path: 'subscription/index.html', url: 'https://netzhenduan.cc/subscription/' },
];

const sitemap = fs.readFileSync('docs/.vitepress/dist/sitemap.xml', 'utf8');

pillars.forEach(p => {
  const filePath = `docs/.vitepress/dist/${p.path}`;
  const html = fs.readFileSync(filePath, 'utf8');
  
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name=["']description["'] content=["'](.*?)["']/) || [])[1];
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').trim();
  const canon = (html.match(/<link rel=["']canonical["'] href=["'](.*?)["']/) || [])[1];
  const inSitemap = sitemap.includes(p.url.replace(/\/$/, '')) || sitemap.includes(p.url);

  console.log(`\n--- [${p.name}] ---`);
  console.log('Path:', p.path);
  console.log('H1:', h1);
  console.log('Title:', title);
  console.log('Description:', desc ? desc.slice(0, 80) + '...' : 'NONE');
  console.log('Canonical:', canon);
  console.log('Sitemap Included:', inSitemap);
});
