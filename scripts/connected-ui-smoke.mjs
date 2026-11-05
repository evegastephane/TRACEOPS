import { chromium } from '@playwright/test';
import express from 'express';
import helmet from 'helmet';
import assert from 'node:assert/strict';
const app=express(); app.use(helmet()); app.use(express.json());
let signed=false,admin=false;const calls=[];
const org={id:'test-client',name:'Hôpital pilote — test',kind:'CLIENT',roles:['CLIENT_MANAGER']};
app.use('/api/v1',(req,res)=>{calls.push(req.method+' '+req.path);const p=req.path;
if(p==='/auth/login'){signed=true;return res.json({});}if(p==='/auth/logout'){signed=false;return res.json({});}
if(!signed)return res.status(401).json({message:'SESSION_REQUIRED'});
if(p==='/auth/me')return res.json({id:'test-user',login:'test',display_name:'Responsable test',admin,must_change_password:false,memberships:[org]});
if(p==='/admin/organizations')return res.json([org]);
if(p==='/organization/members')return res.json([{id:'test-user',login:'test',display_name:'Responsable test',roles:['CLIENT_MANAGER'],active:true}]);
if(p==='/organization/invitations')return res.json({token:'synthetic-test-token'});
if(p==='/sites')return res.json([{id:'test-site',name:'Hôpital pilote',sector:'hospital',timezone:'Africa/Douala'}]);
if(p==='/sites/test-site/zones')return res.json([{id:'test-room',parent_id:null,code:'SAL-101',name:'Salle 101',kind:'ROOM'}]);
res.status(404).json({message:'NOT_FOUND'});});
app.use(express.static('web-dist'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto(`http://127.0.0.1:${server.address().port}`);
await page.getByRole('button',{name:'Se connecter',exact:true}).waitFor();
await page.screenshot({path:'.impeccable/review/login-desktop.png',fullPage:true});
await page.getByLabel('Identifiant',{exact:true}).fill('test');await page.getByLabel('Mot de passe',{exact:true}).fill('testpass');await page.getByRole('button',{name:'Se connecter',exact:true}).click();
await page.getByRole('heading',{name:'Tableau de bord',exact:true}).waitFor();
await page.locator('.dashboard-sites').getByText('Hôpital pilote',{exact:true}).waitFor();
await page.screenshot({path:'.impeccable/review/dashboard-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/dashboard-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:1000});
await page.getByRole('button',{name:'Équipe',exact:true}).click();
await page.getByRole('cell',{name:'Responsable test',exact:true}).waitFor();
assert.equal(await page.locator('.app-top').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
assert.equal(await page.locator('.orgs-pane').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(21, 45, 68)');
await page.keyboard.press('Tab');await page.getByRole('button',{name:'Équipe',exact:true}).focus();
assert.equal(await page.getByRole('button',{name:'Équipe',exact:true}).evaluate(e=>getComputedStyle(e).outlineColor),'rgb(217, 137, 32)');
await page.screenshot({path:'.impeccable/review/desktop.png',fullPage:true});
await page.getByRole('button',{name:'Créer une invitation',exact:true}).click();await page.getByRole('button',{name:'Créer',exact:true}).click();await page.getByRole('heading',{name:'Invitation prête'}).waitFor();assert.match(await page.locator('textarea').inputValue(),/synthetic-test-token/);await page.getByRole('button',{name:'J’ai conservé les informations'}).click();
await page.getByRole('button',{name:'Sites et salles',exact:true}).click();await page.locator('button.site-link').click();await page.getByText('Salle 101',{exact:true}).waitFor();
await page.screenshot({path:'.impeccable/review/sites-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/sites-mobile.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.getByRole('button',{name:'Équipe',exact:true}).click();await page.getByLabel('Langue',{exact:true}).selectOption('en');await page.getByRole('heading',{name:'Team',exact:true}).waitFor();await page.screenshot({path:'.impeccable/review/mobile.png',fullPage:true});
await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
for(const [kind,roles,isAdmin] of [['PROVIDER',['PROVIDER_MANAGER'],false],['CLIENT',['CLIENT_CONTROLLER'],false],['PROVIDER',['FIELD_AGENT'],false],['CLIENT',[],true]]) {
 org.kind=kind;org.roles=roles;admin=isAdmin;await page.reload();await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Manage my team',exact:true}).count(),isAdmin||roles.includes('PROVIDER_MANAGER')?1:0);
 assert.equal(await page.getByRole('button',{name:'Create organization',exact:true}).count()>0,isAdmin);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
}
await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
assert(calls.includes('POST /organization/invitations'));assert(calls.includes('GET /sites/test-site/zones'));assert.deepEqual(errors,[]);
console.log('React UI passed with synthetic API fixtures: sign-in, members, invitation, sites/rooms, FR/EN, logout, desktop/mobile. Backend integration not exercised.');
}finally{await browser.close();server.close();}
