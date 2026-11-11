// Independent arithmetic regression checks for selected sample cases, not faculty sign-off.
import test from 'node:test';
import assert from 'node:assert/strict';
const near=(actual,expected,tol)=>assert.ok(Math.abs(actual-expected)<tol,`${actual} != ${expected}`);
test('selected physics calculations and unit conversions',()=>{
 assert.equal(Math.hypot(40,60-30),50); // R001-R003: RLC phasor voltage, V
 assert.equal(0.09*400**2/3,4800); // R004: gas pressure, Pa
 assert.equal(0.5*(0.5)+0.125*2,0.5); // R005: flux coefficient q/epsilon_0
 near((7e6/1.4e11)*(0.1**3)*1e9,50,1e-9); // R006: mm³, assuming 10 cm edge
 near(Math.hypot(40,2*Math.PI*50*0.0955),50,0.02); // R007/R008: assuming solution's L
 const energy=(6.62607015e-34**2)/(2*9.1093837e-31*(0.3e-9)**2)/1.602176634e-19;
 near(energy,16.71,0.03); // R018/R019: electron kinetic energy, eV
 near(2*10,20,1e-12); // R024: friction, N, conditional on g = 10 and equilibrium
 near(3*0.19/(100*100),5.7e-5,1e-12); // R027: cubical expansion
 near((100-20)/100,0.8,1e-12); // R029: friction coefficient
 near(Math.sqrt(4*Math.PI/(Math.PI/4)),4,1e-12); // R031: same-direction accelerations
 near(Math.sqrt(4*Math.PI/(3*Math.PI/4)),4/Math.sqrt(3),1e-12); // R031: opposite directions differ
 near((1/0.005)*(0.002*0.5-0.0015*0.4)*100,8,1e-10); // R032: cm
 near(Number((6*7.203**2).toPrecision(4))*10,3113,1e-9); // R033: significant figures
 near(2*(1+Math.cos(Math.PI/2)),2,1e-12); // R034: relative to one-wave intensity
 near(((24800*1.602176634e-19)/(299792458))**2/(2*9.1e-31)/1.602176634e-19,602,4); // R039: ~600 eV, nonrelativistic
 near(8.85e-12*10/0.001*25,2.2125e-6,1e-15); // R042: A
 near(64/(64**(2/3)),4,1e-12); // R043: surface charge-density ratio
 near(16*11/8-16/2,14,1e-12); // R044: potential difference, V
});
