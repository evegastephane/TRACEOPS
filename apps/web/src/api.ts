export class ApiError extends Error { constructor(readonly code:string){super(code);} }
export async function api(path:string,body?:unknown,org?:string){
 let response:Response;try{response=await fetch('/api/v1/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Traceops':'request',...(org?{'X-Organization-Id':org}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});}catch{throw new ApiError('network');}
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new ApiError(typeof data.message==='string'?data.message:'error');return data;
}
