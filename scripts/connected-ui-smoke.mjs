import { chromium } from '@playwright/test';
import express from 'express';
import helmet from 'helmet';
import assert from 'node:assert/strict';
const app=express(); app.use(helmet()); app.use(express.json());
let signed=false,admin=false;const calls=[];
const org={id:'test-client',name:'AFISA Food Industry — test',kind:'CLIENT',roles:['CLIENT_MANAGER']};
app.use('/api/v1',(req,res)=>{calls.push(req.method+' '+req.path);const p=req.path;
if(p==='/auth/login'){signed=true;return res.json({});}if(p==='/auth/logout'){signed=false;return res.json({});}
if(!signed)return res.status(401).json({message:'SESSION_REQUIRED'});
if(p==='/auth/me')return res.json({id:'test-user',login:'test',display_name:'Responsable test',admin,must_change_password:false,memberships:[org]});
if(p==='/admin/organizations')return res.json([org]);
if(p==='/organization/members')return res.json([{id:'test-user',login:'test',display_name:'Responsable test',roles:['CLIENT_MANAGER'],active:true}]);
if(p==='/organization/invitations')return res.json({token:'synthetic-test-token'});
if(p==='/organization/overview')return res.json({sites:[{id:'test-site',name:'Hôpital pilote',sector:'hospital',timezone:'Africa/Douala',zones:1,rooms:1,providers:[],controllers:[]}]});
if(p==='/organization/assignments'||p==='/organization/directory')return res.json([]);
if(p==='/organization/profile')return res.json({name:org.name,kind:org.kind});
if(p==='/interventions')return res.json([{id:'test-int',number:7,kind:'CLEANING',title:'Nettoyage quotidien — test',status:'UNDER_REVIEW',priority:'NORMAL',starts_at:new Date().toISOString(),ends_at:new Date(Date.now()+3600000).toISOString(),programme_id:null,site_name:'Usine test',timezone:'Africa/Douala',client_name:org.name,provider_name:'Prestataire test',agents:[{name:'Agent test',lead:true}],zones:['Salle 101'],open_anomalies:0,tasks_total:1,tasks_done:1}]);
if(p==='/programmes')return res.json([]);
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
await page.getByRole('button',{name:'Vue d’ensemble',exact:true}).waitFor();
await page.locator('.work-list').getByText('Nettoyage quotidien — test',{exact:true}).first().waitFor();
await page.getByRole('button',{name:'Planning',exact:true}).click();await page.locator('.visit').first().waitFor();
await page.getByRole('button',{name:'Interventions',exact:true}).click();await page.getByRole('cell',{name:/Nettoyage quotidien — test/}).waitFor();
assert.equal(await page.getByRole('button',{name:'Équipe',exact:true}).count(),0);await page.getByRole('button',{name:'Paramètres',exact:true}).click();
await page.screenshot({path:'.impeccable/review/dashboard-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/dashboard-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1440,height:1000});
await page.getByRole('button',{name:'Équipe',exact:true}).click();
await page.getByRole('cell',{name:'Responsable test',exact:true}).waitFor();
await page.screenshot({path:'.impeccable/review/desktop.png',fullPage:true});
await page.getByRole('button',{name:'Créer une invitation',exact:true}).click();await page.getByRole('button',{name:'Créer',exact:true}).click();await page.getByRole('heading',{name:'Invitation prête'}).waitFor();assert.match(await page.locator('textarea').inputValue(),/synthetic-test-token/);await page.getByRole('button',{name:'J’ai conservé les informations'}).click();
await page.getByRole('button',{name:'Sites et salles',exact:true}).click();await page.locator('button.site-link').click();await page.getByText('Salle 101',{exact:true}).waitFor();
await page.screenshot({path:'.impeccable/review/sites-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.impeccable/review/sites-mobile.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.getByRole('button',{name:'Équipe',exact:true}).click();await page.getByLabel('Langue',{exact:true}).selectOption('en');await page.getByRole('button',{name:'Team',exact:true}).waitFor();await page.screenshot({path:'.impeccable/review/mobile.png',fullPage:true});
await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
for(const [kind,roles,isAdmin] of [['PROVIDER',['PROVIDER_MANAGER'],false],['CLIENT',['CLIENT_CONTROLLER'],false],['PROVIDER',['FIELD_AGENT'],false],['CLIENT',[],true]]) {
 org.kind=kind;org.roles=roles;admin=isAdmin;await page.reload();await page.getByRole('button',{name:'Overview',exact:true}).first().waitFor();
 assert.equal(await page.getByRole('button',{name:'Interventions',exact:true}).count(),1);
 assert.equal(await page.getByRole('button',{name:'Activity log',exact:true}).count(),isAdmin?1:0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
}
await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
assert(calls.includes('POST /organization/invitations'));assert(calls.includes('GET /sites/test-site/zones'));assert.deepEqual(errors,[]);
console.log('React UI passed with synthetic API fixtures: sign-in, overview, planning, interventions, settings group, members, invitation, sites/rooms, FR/EN, logout, desktop/mobile. Backend integration not exercised.');
}finally{await browser.close();server.close();}
