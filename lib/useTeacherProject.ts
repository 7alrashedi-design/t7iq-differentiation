"use client";
import {useCallback,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {getSupabaseBrowserClient} from "@/lib/supabase/client";

export type TeacherProject={
 id:string;title:string;subject:string|null;grade:string|null;lesson:string|null;
 learning_goal:string|null;readiness_evidence:string|null;status:string;
 selected_tools:string[];project_data:Record<string,any>;
};

export function useTeacherProject(){
 const params=useSearchParams();
 const projectId=params.get("project");
 const [project,setProject]=useState<TeacherProject|null>(null);
 const [projectLoading,setProjectLoading]=useState(Boolean(projectId));
 const [projectError,setProjectError]=useState("");

 const reload=useCallback(async()=>{
  if(!projectId){setProjectLoading(false);return}
  setProjectLoading(true);setProjectError("");
  try{
   const s=getSupabaseBrowserClient();
   const {data,error}=await s.from("teacher_differentiation_projects")
    .select("id,title,subject,grade,lesson,learning_goal,readiness_evidence,status,selected_tools,project_data")
    .eq("id",projectId).single();
   if(error)throw error;
   setProject(data as TeacherProject);
  }catch(e:any){setProjectError(e?.message||"تعذر تحميل المشروع")}
  finally{setProjectLoading(false)}
 },[projectId]);

 useEffect(()=>{reload()},[reload]);

 const saveTool=useCallback(async(toolKey:string,payload:any)=>{
  if(!projectId)throw new Error("ابدأ من مشروع محفوظ حتى تُضم هذه الأداة إلى خطة الدرس.");
  const s=getSupabaseBrowserClient();
  const {data,error}=await s.rpc("save_teacher_project_tool",{p_project_id:projectId,p_tool_key:toolKey,p_payload:payload});
  if(error)throw error;
  const next=(data||{}) as Record<string,any>;
  setProject(p=>p?{...p,project_data:next}:p);
 },[projectId,project]);

 const toolRoutes:Record<string,string>={readiness:"/teacher/lab/tiering",thinking:"/teacher/lab/bloom",concepts:"/teacher/lab/venn",choice:"/teacher/lab/xo",operations:"/teacher/lab/classroom"};
 const nextHref=(current:string)=>{if(!projectId||!project)return null;const order=["readiness","thinking","concepts","choice","operations"];const selected=order.filter(x=>(project.selected_tools||[]).includes(x));const i=selected.indexOf(current);const next=selected[i+1];return next?toolRoutes[next]+"?project="+projectId:"/teacher/plan/"+projectId};
 return {projectId,project,projectLoading,projectError,reload,saveTool,nextHref};
}
