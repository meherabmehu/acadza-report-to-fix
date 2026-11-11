import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {chromium} from 'playwright';import AxeBuilder from '@axe-core/playwright';
test('automated WCAG checks on key screens at desktop and mobile sizes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'acadza-axe-')),port=32000+Math.floor(Math.random()*12000),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),NODE_ENV:'test',AUTO_APPLY_SAFE:'false',STATE_FILE:path.join(dir,'state.json')}});
 t.after(()=>{child.kill();fs.rmSync(dir,{recursive:true,force:true})});let stderr='';child.stderr.on('data',x=>stderr+=x);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout: '+stderr)),8000);child.stdout.on('data',x=>{if(x.toString().includes('Faculty console listening')){clearTimeout(timer);resolve()}});child.once('exit',()=>{clearTimeout(timer);reject(Error('startup failed: '+stderr))})});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});t.after(()=>browser.close());
 for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();await page.goto(base);await page.getByRole('heading',{name:'A clearer way to review.'}).waitFor();
  for(const nav of ['dashboard','queue','bank','insights','audit','settings','case']){
   if(nav==='case'){await page.locator('[data-nav="queue"]').first().click();await page.getByRole('button',{name:'View case'}).first().click()}else await page.locator(`[data-nav="${nav}"]`).first().click();
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   assert.deepEqual(result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),[],`${nav} at ${width}px`);
  }
  await page.locator('[data-nav="queue"]').first().click();await page.locator('#search').fill('60f744b3f1b9bc7cc7b4a949');await page.getByRole('button',{name:'View case'}).click();await page.getByRole('button',{name:'Approve fix'}).click();
  const modalResult=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.deepEqual(modalResult.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],`decision dialog at ${width}px`);await page.locator('#close-dialog').click();
  for(const id of ['622f08d7b70e4b50e4500a1b','622df25ab70e4b50e44ff837','68f21caf941cda588bc04365','63c7cce12981ed154ee92c94']){
   await page.getByRole('button',{name:'Report queue',exact:true}).click();await page.locator('#search').fill(id);await page.getByRole('button',{name:'View case'}).click();
   const opener=page.getByRole('button',{name:'Author a fix'});await opener.focus();await page.keyboard.press('Enter');await page.getByRole('dialog',{name:'Author a careful fix'}).waitFor();
   const check=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.deepEqual(check.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],`author dialog ${id} at ${width}px`);
   await page.keyboard.press('Escape');assert.equal(await opener.evaluate(el=>document.activeElement===el),true,'Escape returns focus to opener');
  }
  await context.close();
 }
});
