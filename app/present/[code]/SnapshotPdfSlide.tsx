"use client";
import {useEffect,useRef} from "react";

export const CANONICAL_SNAPSHOT_URL="https://mihalnbzprdqaaprjkha.supabase.co/storage/v1/object/public/workshop-public-assets/google-slides-canonical-2026-10-23.pdf";
const PDF_JS_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDF_WORKER_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
type RenderTask={promise:Promise<void>;cancel:()=>void};
type Page={getViewport:(args:{scale:number})=>{width:number;height:number};render:(args:{canvasContext:CanvasRenderingContext2D;viewport:{width:number;height:number}})=>RenderTask};
type PdfDocument={numPages:number;getPage:(page:number)=>Promise<Page>};
type PdfLib={GlobalWorkerOptions:{workerSrc:string};getDocument:(args:{url:string;withCredentials:boolean})=>{promise:Promise<PdfDocument>}};
declare global {interface Window {pdfjsLib?:PdfLib}}
let libraryPromise:Promise<PdfLib>|null=null;
let pdfDocumentPromise:Promise<PdfDocument>|null=null;

function loadLibrary(){
 if(typeof window==="undefined")return Promise.reject(new Error("client_only"));
 if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
 if(!libraryPromise){
  libraryPromise=new Promise<PdfLib>((resolve,reject)=>{
   const script=document.createElement("script");
   script.src=PDF_JS_URL;script.async=true;script.dataset.workshopPdfjs="true";
   const timeout=window.setTimeout(()=>reject(new Error("pdfjs_load_timeout")),20000);
   script.onload=()=>{window.clearTimeout(timeout);if(window.pdfjsLib)resolve(window.pdfjsLib);else reject(new Error("pdfjs_missing"))};
   script.onerror=()=>{window.clearTimeout(timeout);reject(new Error("pdfjs_cdn_unavailable"))};
   document.head.appendChild(script);
  }).catch(e=>{libraryPromise=null;throw e});
 }
 return libraryPromise;
}
async function loadDocument(){
 if(!pdfDocumentPromise){
  pdfDocumentPromise=loadLibrary().then(lib=>{
   lib.GlobalWorkerOptions.workerSrc=PDF_WORKER_URL;
   return lib.getDocument({url:CANONICAL_SNAPSHOT_URL,withCredentials:false}).promise;
  }).then(doc=>{if(doc.numPages!==38)throw new Error("wrong_canonical_slide_count");return doc})
    .catch(e=>{pdfDocumentPromise=null;throw e});
 }
 return pdfDocumentPromise;
}

export default function SnapshotPdfSlide({page,onReady,onFailure}:{page:number;onReady:()=>void;onFailure:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const ready=useRef(onReady);const fail=useRef(onFailure);ready.current=onReady;fail.current=onFailure;
 useEffect(()=>{
  let cancelled=false;let task:RenderTask|null=null;
  async function render(){
   try{
    const doc=await loadDocument();
    if(cancelled)return;
    const slide=await doc.getPage(page);
    if(cancelled)return;
    const target=canvas.current;
    if(!target)throw new Error("canvas_not_found");
    const viewport=slide.getViewport({scale:2});
    target.width=Math.ceil(viewport.width);target.height=Math.ceil(viewport.height);
    const ctx=target.getContext("2d",{alpha:false});
    if(!ctx)throw new Error("canvas_context_unavailable");
    task=slide.render({canvasContext:ctx,viewport});
    await task.promise;
    if(!cancelled)ready.current();
   }catch(e){
    if(!cancelled)fail.current();
   }
  }
  void render();
  return()=>{cancelled=true;if(task){try{task.cancel()}catch{}}};
 },[page]);
 return <canvas ref={canvas} className="exactSnapshotCanvas" role="img" aria-label={`الشريحة ${page} من 38 — نسخة مطابقة مصدرة من Google Slides`}/>;
}
