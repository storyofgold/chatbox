(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function o(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=o(e);fetch(e.href,t)}})();const P={x:.3,y:4,width:100-.4-5.6,height:86},I=async a=>({inlineData:{data:await new Promise((n,e)=>{const t=new FileReader;t.onloadend=()=>{typeof t.result=="string"?n(t.result.split(",")[1]):e(new Error("Failed to read file as string."))},t.onerror=r=>{e(r)},t.readAsDataURL(a)}),mimeType:a.type}}),D=a=>{if(!a)return[];const i=a.split(`
`).map(n=>n.trim()).filter(Boolean),o=[];for(const n of i)try{if(n.toUpperCase().startsWith("LINE:")){const e=/x1=([\d.]+).*y1=([\d.]+).*x2=([\d.]+).*y2=([\d.]+).*color=([^,]+).*strokeWidth=([\d.]+)/i.exec(n);e&&o.push({type:"line",x1:+e[1],y1:+e[2],x2:+e[3],y2:+e[4],color:e[5].trim(),strokeWidth:+e[6]||.3})}else if(n.toUpperCase().startsWith("RECT:")){const e=/x=([\d.]+).*y=([\d.]+).*width=([\d.]+).*height=([\d.]+).*color=([^,]+).*fillOpacity=([\d.]+)/i.exec(n);e&&o.push({type:"rect",x:+e[1],y:+e[2],width:+e[3],height:+e[4],color:e[5].trim(),fillOpacity:+e[6]||.2})}else if(n.toUpperCase().startsWith("TEXT:")){const e=/x=([\d.]+).*y=([\d.]+).*text=\"([^\"]+)\".*color=([^,]+).*fontSize=([\d.]+)/i.exec(n);e&&o.push({type:"text",x:+e[1],y:+e[2],text:e[3],color:e[4].trim(),fontSize:+e[5]||1.5})}}catch(e){console.error("Failed to parse annotation line:",n,e)}return o},F=(a,i,o)=>{a.innerHTML="";const n=document.createElementNS("http://www.w3.org/2000/svg","g");n.setAttribute("transform",`translate(${o.x} ${o.y}) scale(${o.width/100} ${o.height/100})`),i.forEach(e=>{let t;e.type==="line"?(t=document.createElementNS("http://www.w3.org/2000/svg","line"),t.setAttribute("x1",String(e.x1)),t.setAttribute("y1",String(e.y1)),t.setAttribute("x2",String(e.x2)),t.setAttribute("y2",String(e.y2)),t.setAttribute("stroke",e.color||"#ffffff"),t.setAttribute("stroke-width",String(e.strokeWidth))):e.type==="rect"?(t=document.createElementNS("http://www.w3.org/2000/svg","rect"),t.setAttribute("x",String(e.x)),t.setAttribute("y",String(e.y)),t.setAttribute("width",String(e.width)),t.setAttribute("height",String(e.height)),t.setAttribute("fill",e.color||"#ffffff"),t.setAttribute("fill-opacity",String(e.fillOpacity))):e.type==="text"&&(t=document.createElementNS("http://www.w3.org/2000/svg","text"),t.setAttribute("x",String(e.x)),t.setAttribute("y",String(e.y)),t.setAttribute("fill",e.color||"#ffffff"),t.setAttribute("font-size",String(e.fontSize)),t.textContent=e.text),t&&n.appendChild(t)}),a.appendChild(n)};document.addEventListener("DOMContentLoaded",()=>{const a=document.getElementById("analysis-form"),i=document.getElementById("chart-upload"),o=document.getElementById("upload-button"),n=document.getElementById("file-name-display"),e=document.getElementById("user-query-input"),t=document.getElementById("analyze-button"),r=document.getElementById("analysis-history"),E=document.querySelector(".placeholder");let h=null;if(a&&i&&o&&n&&e&&t&&r){const g=()=>{e!=null&&e.value.trim()?t.disabled=!1:t.disabled=!0},x=s=>{s&&s.type.startsWith("image/")?(h=s,n.textContent=s.name,o.classList.add("file-selected")):(h=null,n.textContent="",o.classList.remove("file-selected"),s&&alert("Please select an image file (e.g., PNG, JPG).")),g()};o.addEventListener("click",()=>i.click()),i.addEventListener("change",()=>{const s=i.files?i.files[0]:null;x(s)}),e.addEventListener("input",()=>{g(),e.style.height="auto",e.style.height=`${e.scrollHeight}px`}),r.addEventListener("dragover",s=>{s.preventDefault(),r.classList.add("drag-over")}),r.addEventListener("dragleave",s=>{s.preventDefault(),r.classList.remove("drag-over")}),r.addEventListener("drop",s=>{var c;s.preventDefault(),r.classList.remove("drag-over");const l=(c=s.dataTransfer)!=null&&c.files?s.dataTransfer.files[0]:null;l&&(i.files=s.dataTransfer.files,x(l))}),a.addEventListener("submit",async s=>{s.preventDefault();const l=e.value.trim();if(!l){alert("Please enter a query.");return}E&&(E.style.display="none");const c=h,p=document.createElement("div");p.className="analysis-entry";const v=document.createElement("p");v.className="user-query-text",v.textContent=c?`Your query for "${c.name}": "${l}"`:`Your question: "${l}"`;const y=document.createElement("div");y.className="loader",p.appendChild(v);let m=null;if(c){const d=document.createElement("div");d.className="image-container";const u=document.createElement("img");u.src=URL.createObjectURL(c),u.alt="Uploaded chart screenshot for analysis",m=document.createElementNS("http://www.w3.org/2000/svg","svg"),m.setAttribute("class","annotation-overlay"),m.setAttribute("viewBox","0 0 100 100"),m.setAttribute("preserveAspectRatio","none"),d.appendChild(u),d.appendChild(m),p.appendChild(d)}p.appendChild(y),r.appendChild(p),r.scrollTop=r.scrollHeight,x(null),i.value="",e.value="",e.style.height="auto",g();try{const S=(await(await fetch("https://45.130.165.161:8081/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({})})).json()).reference,U=(await(await fetch("https://45.130.165.161:8081/api-query/api-query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:l})})).json()).answer;if(c){const w=await I(c),A=`You are an expert financial market analyst specializing in Wyckoff methodology.

**Reference Knowledge:**
You have access to the following reference knowledge extracted from a book on market structure and Wyckoff methodology:
---
${S}
---

**User's Context:**
The user has provided the following query or context for the analysis:
"${l}"

**Analysis Task & Output Format:**
Your analysis MUST be based on the principles from the provided reference knowledge. Your response MUST follow this exact structure:

1.  **Narrative Analysis:** Provide a detailed, structured narrative explaining the market's story according to Wyckoff principles found in the reference knowledge. Identify accumulation, distribution, or other patterns. Explain your reasoning step by step, applying the rules from the book. Highlight key events, levels, or points. Do not assume information that is not in the reference.

2.  **Key Points Summary:** A mandatory section starting with the exact header "**Key Points:**". This must contain a bulleted list summarizing every critical event, price level, and date you identified in your narrative. This is the primary summary for generating visual annotations.
    **Example for "Key Points:":**
    - Selling Climax (SC) at price 1850.50 on Jan 10
    - Automatic Rally (AR) resistance at price 1880.00 on Jan 11
    - Secondary Test (ST) at price 1855.25 on Jan 12

3.  **Annotation Instructions Separator:** You MUST include a separator line exactly as follows:
--- ANNOTATIONS ---

4.  **Annotation Instructions:** Following the separator, provide a list of visual annotation instructions based on your "Key Points" summary.

**CRITICAL ANNOTATION INSTRUCTIONS:**

1.  **Fixed Plotting Area:** The main plotting area (where price action occurs) is a fixed region. Your coordinates MUST be placed within this area. The plotting area is defined by excluding the following from the image dimensions:
    *   Top: 4% is excluded.
    *   Bottom: 20% is excluded.
    *   Left: 5.6% is excluded.
    *   Right: 0.5% is excluded.

2.  **Coordinate System:** Coordinates are percentages relative to this fixed plotting area.
    *   X-Coordinate (Time): Left edge is x=0, right edge is x=100.
    *   Y-Coordinate (Price): **Top** edge is y=0, **bottom** edge is y=100.

3.  **Formats:** Output ONLY a list of annotation instructions in the specified formats.
    - LINE: x1=10.5, y1=20.0, x2=50.2, y2=20.8, color=#FF0000, strokeWidth=0.3
    - RECT: x=10.0, y=15.5, width=40.0, height=20.0, color=#00FF00, fillOpacity=0.2
    - TEXT: x=15.0, y=18.5, text="Label", color=#FFD600, fontSize=1.5

4.  **Clarity:** Keep text labels concise (e.g., "BC", "AR", "SOS"). Do not include price values in the text labels. Place labels slightly above or below points for clarity.

Begin your full analysis now.`,f=(await ai.models.generateContent({model:"gemini-2.5-flash",contents:{parts:[w,{text:A}]}})).text,N="--- ANNOTATIONS ---",T=f.indexOf(N);let L=f,O="";T!==-1?(L=f.substring(0,T).trim(),O=f.substring(T+N.length).trim()):console.warn("Annotation separator not found in the response.");const b=document.createElement("div");if(b.className="analysis-text",b.innerHTML=L.replace(/\n/g,"<br>"),m){const k=D(O);F(m,k,P)}p.replaceChild(b,y)}else{const w=`You are an expert financial market analyst specializing in Wyckoff methodology.

**Reference Knowledge:**
You have access to the following reference knowledge extracted from a book on market structure and Wyckoff methodology:
---
${S}
---

**User's Question:**
"${l}"

**Task:**
Based *only* on the provided reference knowledge, please answer the user's question. Provide a clear, structured, and helpful explanation. Do not use any external knowledge or make assumptions beyond the text provided.`,C=(await ai.models.generateContent({model:"gemini-2.5-flash",contents:{parts:[{text:w}]}})).text,f=document.createElement("div");f.className="analysis-text",f.innerHTML=C.replace(/\n/g,"<br>"),p.replaceChild(f,y)}}catch(d){console.error("Analysis error:",d);const u=document.createElement("div");u.className="analysis-text",u.innerHTML='<p class="error-message">Failed to get analysis. Please check the console for more details.</p>',d instanceof Error&&(u.innerHTML+=`<p class="error-details">${d.message}</p>`),p.replaceChild(u,y)}finally{r.scrollTop=r.scrollHeight}})}else console.warn("One or more analysis panel elements are not found in the DOM.")});
