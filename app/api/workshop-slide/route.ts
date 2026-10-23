import {createSign} from "node:crypto";
import {NextResponse} from "next/server";
export const runtime="nodejs";
const deckId="1pLBZx1olhefO_lGhEkecRSW3yQTXhoJgZ5achnxvLD0";
const ids=["h23522bd9a010cb02_0_2","refpage_003","h23522bd9a010cb02_20_7","h23522bd9a010cb02_0_53","h23522bd9a010cb02_0_63","h23522bd9a010cb02_0_72","h23522bd9a010cb02_0_81","h23522bd9a010cb02_0_90","h23522bd9a010cb02_0_99","h23522bd9a010cb02_0_108","h23522bd9a010cb02_0_117","h23522bd9a010cb02_0_127","h23522bd9a010cb02_0_137","h23522bd9a010cb02_0_146","h23522bd9a010cb02_0_155","h23522bd9a010cb02_0_164","h23522bd9a010cb02_0_172","h23522bd9a010cb02_0_180","h23522bd9a010cb02_0_188","h23522bd9a010cb02_0_196","h23522bd9a010cb02_0_204","h23522bd9a010cb02_0_219","h23522bd9a010cb02_0_227","h23522bd9a010cb02_0_235","h23522bd9a010cb02_0_243","h23522bd9a010cb02_0_252","h23522bd9a010cb02_0_261","h23522bd9a010cb02_0_269","h23522bd9a010cb02_0_277","h23522bd9a010cb02_0_285","h23522bd9a010cb02_0_293","h23522bd9a010cb02_0_301","h23522bd9a010cb02_0_309","h23522bd9a010cb02_0_317","h23522bd9a010cb02_0_325","h23522bd9a010cb02_0_333","h23522bd9a010cb02_0_341","refpage_002"] as const;
const b64=(v:string)=>Buffer.from(v).toString("base64url");
async function token(){
 const raw=process.env.GOOGLE_SLIDES_SERVICE_ACCOUNT_JSON;
 if(!raw)throw new Error("not_configured");
 const account=JSON.parse(raw) as {client_email:string;private_key:string;token_uri?:string};
 if(!account.client_email||!account.private_key)throw new Error("invalid_service_account");
 const t=Math.floor(Date.now()/1000);
 const body=b64(JSON.stringify({iss:account.client_email,scope:"https://www.googleapis.com/auth/presentations.readonly",aud:account.token_uri||"https://oauth2.googleapis.com/token",iat:t,exp:t+3500}));
 const header=b64(JSON.stringify({alg:"RS256",typ:"JWT"}));
 const payload=header+"."+body;
 const sign=createSign("RSA-SHA256");sign.update(payload);sign.end();
 const jwt=payload+"."+sign.sign(account.private_key,"base64url");
 const result=await fetch(account.token_uri||"https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt}),cache:"no-store"});
 if(!result.ok)throw new Error("oauth_failed");
 const data=await result.json() as {access_token?:string};
 if(!data.access_token)throw new Error("missing_token");
 return data.access_token;
}
export async function GET(request:Request){
 const u=new URL(request.url);const index=Number(u.searchParams.get("page"));
 if(!Number.isInteger(index)||index<1||index>38)return NextResponse.json({error:"page_out_of_range"},{status:400});
 try{
  const access=await token();
  const endpoint="https://slides.googleapis.com/v1/presentations/"+deckId+"/pages/"+encodeURIComponent(ids[index-1])+"/thumbnail?thumbnailProperties.mimeType=PNG&thumbnailProperties.thumbnailSize=LARGE";
  const response=await fetch(endpoint,{headers:{Authorization:"Bearer "+access},cache:"no-store"});
  if(!response.ok)return NextResponse.json({error:"google_thumbnail_unavailable",page:index},{status:503});
  const data=await response.json() as {contentUrl?:string};
  if(!data.contentUrl)return NextResponse.json({error:"no_thumbnail",page:index},{status:503});
  const picture=await fetch(data.contentUrl,{cache:"no-store"});
  if(!picture.ok)return NextResponse.json({error:"image_unavailable"},{status:503});
  return new NextResponse(await picture.arrayBuffer(),{status:200,headers:{"Content-Type":picture.headers.get("content-type")||"image/png","Cache-Control":"private, max-age=60"}});
 }catch(e){
  return NextResponse.json({error:e instanceof Error&&e.message==="not_configured"?"google_renderer_not_configured":"renderer_unavailable"},{status:503});
 }
}
