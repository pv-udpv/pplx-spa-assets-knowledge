// ==UserScript==
// @name         Perplexity DevTool (Eruda Edition)
// @namespace    https://github.com/pv-udpv/pplx-spa-assets-knowledge
// @version      1.0.0
// @author       pv-udpv
// @description  Advanced DevTool with Eruda integration for mobile reverse engineering
// @icon         https://www.perplexity.ai/favicon.ico
// @homepage     https://github.com/pv-udpv/pplx-spa-assets-knowledge
// @supportURL   https://github.com/pv-udpv/pplx-spa-assets-knowledge/issues
// @downloadURL  https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/dist/pplx-devtool.user.js
// @updateURL    https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/dist/pplx-devtool.user.js
// @match        https://www.perplexity.ai/*
// @require      https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js
// @connect      api.github.com
// @connect      raw.githubusercontent.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    class f{baseURL="https://www.perplexity.ai";endpoints=[];constructor(t=[]){this.endpoints=t;}async fetch(t,e={}){const s=t.startsWith("http")?t:`${this.baseURL}${t}`,o={"Content-Type":"application/json",...e.headers||{}};e.body instanceof FormData&&delete o["Content-Type"];const r=performance.now();try{const a=await fetch(s,{...e,headers:o,credentials:"include"}),i=performance.now()-r,l=a.headers.get("content-type");let p;l?.includes("application/json")?p=await a.json():p=await a.text();const d={};return a.headers.forEach((h,u)=>{d[u]=h;}),{ok:a.ok,status:a.status,data:p,headers:d,latency:i}}catch(a){const n=performance.now();return {ok:false,status:0,data:{error:a.message},latency:n-r}}}getEndpoints(){return this.endpoints}setEndpoints(t){this.endpoints=t;}findEndpoint(t,e){return this.endpoints.find(s=>s.method===t&&s.path===e)}}class m{coverage={};storageKey="pplx-api-coverage";constructor(){this.load();}load(){try{const t=localStorage.getItem(this.storageKey);t&&(this.coverage=JSON.parse(t));}catch(t){console.error("[Coverage] Failed to load:",t);}}save(){try{localStorage.setItem(this.storageKey,JSON.stringify(this.coverage));}catch(t){console.error("[Coverage] Failed to save:",t);}}initCategory(t,e){this.coverage[t]||(this.coverage[t]={});for(const s of e){const o=`${s.method} ${s.path}`;this.coverage[t][o]||(this.coverage[t][o]={called:false,callCount:0,lastCalled:null,lastStatus:null,avgLatency:0});}this.save();}markCalled(t,e,s,o){let r="other";for(const i in this.coverage){const l=`${t} ${e}`;if(this.coverage[i]?.[l]){r=i;break}}const a=`${t} ${e}`;this.coverage[r]||(this.coverage[r]={}),this.coverage[r]?.[a]||(this.coverage[r][a]={called:false,callCount:0,lastCalled:null,lastStatus:null,avgLatency:0});const n=this.coverage[r][a];n&&(n.called=true,n.callCount++,n.lastCalled=new Date().toISOString(),n.lastStatus=s,o!==void 0&&(n.avgLatency=(n.avgLatency*(n.callCount-1)+o)/n.callCount)),this.save();}getStats(){const t={};for(const[e,s]of Object.entries(this.coverage)){const o=Object.keys(s).length,r=Object.values(s).filter(n=>n.called).length,a=o>0?Math.round(r/o*100):0;t[e]={total:o,called:r,coverage:a};}return t}getCoverage(){return this.coverage}reset(){this.coverage={},this.save();}}class y{endpoints=new Map;storageKey="pplx-openapi-schema";constructor(){this.load();}load(){try{const t=localStorage.getItem(this.storageKey);if(t){const e=JSON.parse(t);this.endpoints=new Map(Object.entries(e));}}catch(t){console.error("[OpenAPI] Failed to load:",t);}}save(){try{const t=Object.fromEntries(this.endpoints);localStorage.setItem(this.storageKey,JSON.stringify(t));}catch(t){console.error("[OpenAPI] Failed to save:",t);}}addEndpoint(t,e,s){const o=`${e} ${t}`;let r=this.endpoints.get(o);r||(r={method:e,path:t,responses:{},responseCount:0});const a=s.status.toString();r.responses[a]||(r.responses[a]={description:this.getStatusDescription(s.status),content:{"application/json":{schema:this.inferSchema(s.body),examples:[]}}});const n=r.responses[a].content["application/json"].examples;n.length<3&&n.push({timestamp:new Date().toISOString(),value:s.body,latency:s.latency}),r.responseCount++,this.endpoints.set(o,r),this.save();}inferSchema(t){if(t===null)return {type:"null"};if(Array.isArray(t))return {type:"array",items:t.length>0?this.inferSchema(t[0]):{type:"object"}};if(typeof t=="object"){const e={};for(const[s,o]of Object.entries(t))e[s]=this.inferSchema(o);return {type:"object",properties:e}}return typeof t=="string"?{type:"string"}:typeof t=="number"?Number.isInteger(t)?{type:"integer"}:{type:"number"}:typeof t=="boolean"?{type:"boolean"}:{type:"string"}}getStatusDescription(t){return {200:"Successful response",201:"Created",400:"Bad request",401:"Unauthorized",403:"Forbidden",404:"Not found",500:"Internal server error"}[t]||`HTTP ${t}`}build(){const t={};for(const[,e]of this.endpoints)t[e.path]||(t[e.path]={}),t[e.path][e.method.toLowerCase()]={summary:e.summary||`${e.method} ${e.path}`,operationId:`${e.method.toLowerCase()}_${e.path.replace(/\//g,"_")}`,responses:e.responses,...e.requestBody&&{requestBody:e.requestBody},...e.parameters&&{parameters:e.parameters}};return {openapi:"3.1.0",info:{title:"Perplexity API",version:"1.0.0",description:"Auto-generated OpenAPI schema from live traffic capture"},servers:[{url:"https://www.perplexity.ai"}],paths:t}}getEndpoints(){return Array.from(this.endpoints.values())}diff(t){const e=new Set(Object.keys(this.build().paths)),s=new Set(Object.keys(t.paths)),o=Array.from(e).filter(n=>!s.has(n)),r=Array.from(s).filter(n=>!e.has(n)),a=[];for(const n of e)if(s.has(n)){const i=JSON.stringify(this.build().paths[n]),l=JSON.stringify(t.paths[n]);i!==l&&a.push(n);}return {added:o,removed:r,modified:a}}clear(){this.endpoints.clear(),this.save();}}class x{callbacks=[];originalFetch;originalXHROpen;originalXHRSend;constructor(){this.originalFetch=window.fetch,this.originalXHROpen=XMLHttpRequest.prototype.open,this.originalXHRSend=XMLHttpRequest.prototype.send;}onIntercept(t){this.callbacks.push(t);}start(){this.interceptFetch(),this.interceptXHR(),console.log("[Interceptors] Started");}stop(){window.fetch=this.originalFetch,XMLHttpRequest.prototype.open=this.originalXHROpen,XMLHttpRequest.prototype.send=this.originalXHRSend,console.log("[Interceptors] Stopped");}interceptFetch(){const t=this;window.fetch=async function(...e){const[s,o]=e,r=typeof s=="string"?s:s.toString(),a=o?.method||"GET",n=performance.now();try{const i=await t.originalFetch.apply(window,e),p=performance.now()-n,d=i.clone();let h;try{h=await d.json();}catch{h=await d.text();}for(const u of t.callbacks)u(a,r,i.status,h,p);return i}catch(i){const p=performance.now()-n;for(const d of t.callbacks)d(a,r,0,{error:i.message},p);throw i}};}interceptXHR(){const t=this;XMLHttpRequest.prototype.open=function(e,s,...o){return this._method=e,this._url=s.toString(),this._startTime=performance.now(),t.originalXHROpen.apply(this,[e,s,...o])},XMLHttpRequest.prototype.send=function(e){const s=this;return s.addEventListener("loadend",function(){const o=performance.now(),r=o-(s._startTime||o);let a;try{a=JSON.parse(s.responseText);}catch{a=s.responseText;}for(const n of t.callbacks)n(s._method||"GET",s._url||"",s.status,a,r);}),t.originalXHRSend.apply(this,[e])};}}class v{constructor(t,e){this.api=t,this.coverage=e;}mount(t){t.innerHTML=`
      <div class="api-explorer">
        <div class="coverage-summary">
          <h4>📊 API Coverage</h4>
          <div id="coverage-stats"></div>
        </div>
        
        <div class="endpoint-categories">
          <h4>🔍 Endpoints</h4>
          <div id="endpoint-list"></div>
        </div>
        
        <div class="response-viewer">
          <h4>📄 Response</h4>
          <pre id="response-output">Select endpoint to test...</pre>
        </div>
      </div>
    `,this.attachStyles(t),this.renderCoverage(t.querySelector("#coverage-stats")),this.renderEndpoints(t.querySelector("#endpoint-list"));}attachStyles(t){const e=document.createElement("style");e.textContent=`
      .api-explorer {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .api-explorer h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #667eea;
      }
      .coverage-summary {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      #coverage-stats {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .coverage-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
      }
      .category {
        min-width: 80px;
        color: #aaa;
      }
      .progress-bar {
        flex: 1;
        height: 6px;
        background: #333;
        border-radius: 3px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
      }
      .percentage {
        min-width: 40px;
        text-align: right;
        color: #667eea;
        font-weight: 600;
      }
      .endpoint-categories {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
      }
      #endpoint-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .endpoint-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 11px;
        text-align: left;
      }
      .endpoint-btn:hover {
        background: #333;
        border-color: #667eea;
      }
      .method {
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .method-get { background: #61affe; color: #000; }
      .method-post { background: #49cc90; color: #000; }
      .method-put { background: #fca130; color: #000; }
      .method-delete { background: #f93e3e; color: #fff; }
      .path {
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #ddd;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .response-viewer {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      #response-output {
        margin: 0;
        padding: 10px;
        background: #1a1a1a;
        border-radius: 4px;
        font-size: 11px;
        line-height: 1.4;
        overflow-x: auto;
        max-height: 200px;
        overflow-y: auto;
      }
    `,t.appendChild(e);}renderCoverage(t){const e=this.coverage.getStats();if(Object.keys(e).length===0){t.innerHTML='<p style="color: #aaa; font-size: 12px;">No coverage data yet. Test some endpoints!</p>';return}t.innerHTML=Object.entries(e).map(([s,o])=>`
        <div class="coverage-item">
          <span class="category">${s}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${o.coverage}%"></div>
          </div>
          <span class="percentage">${o.coverage}%</span>
        </div>
      `).join("");}renderEndpoints(t){const e=this.api.getEndpoints();if(e.length===0){t.innerHTML='<p style="color: #aaa; font-size: 12px;">No endpoints available. Check API schema.</p>';return}t.innerHTML=e.map(s=>`
        <button class="endpoint-btn" 
                data-method="${s.method}"
                data-path="${s.path}"
                data-category="${s.category}">
          <span class="method method-${s.method.toLowerCase()}">${s.method}</span>
          <span class="path">${s.path}</span>
        </button>
      `).join(""),t.querySelectorAll(".endpoint-btn").forEach(s=>{s.addEventListener("click",async o=>{const r=o.currentTarget,a=r.dataset.method,n=r.dataset.path;await this.testEndpoint(a,n);});});}async testEndpoint(t,e){const s=document.querySelector("#response-output");s.textContent=`⏳ Testing ${t} ${e}...`;try{const o=await this.api.fetch(e,{method:t});s.textContent=JSON.stringify({status:o.status,ok:o.ok,latency:`${o.latency?.toFixed(2)}ms`,data:o.data},null,2),this.coverage.markCalled(t,e,o.status,o.latency),this.renderCoverage(document.querySelector("#coverage-stats"));}catch(o){s.textContent=`❌ Error: ${o.message}`;}}}class S{constructor(t){this.builder=t;}isCapturing=false;mount(t){t.innerHTML=`
      <div class="schema-inspector">
        <div class="actions">
          <button id="capture-btn" class="action-btn">
            📡 <span id="capture-text">Start Capture</span>
          </button>
          <button id="export-btn" class="action-btn">💾 Export OpenAPI</button>
          <button id="diff-btn" class="action-btn">🔍 Diff with Repo</button>
          <button id="clear-btn" class="action-btn danger">🗑️ Clear Schema</button>
        </div>
        
        <div class="schema-tree">
          <h4>🌳 Discovered Endpoints</h4>
          <div id="schema-tree-view"></div>
        </div>
        
        <div class="schema-preview">
          <h4>📋 OpenAPI Preview</h4>
          <pre id="schema-output"></pre>
        </div>
      </div>
    `,this.attachStyles(t),this.attachHandlers(t),this.renderTree(t.querySelector("#schema-tree-view")),this.renderPreview(t.querySelector("#schema-output"));}attachStyles(t){const e=document.createElement("style");e.textContent=`
      .schema-inspector {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .action-btn {
        padding: 8px 12px;
        background: #667eea;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .action-btn:hover {
        background: #5568d3;
      }
      .action-btn.danger {
        background: #f93e3e;
      }
      .action-btn.danger:hover {
        background: #e02929;
      }
      .action-btn.active {
        background: #49cc90;
      }
      .schema-tree, .schema-preview {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      .schema-tree h4, .schema-preview h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #667eea;
      }
      #schema-tree-view {
        max-height: 200px;
        overflow-y: auto;
      }
      .endpoint-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #1e1e1e;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 11px;
      }
      .badge {
        padding: 2px 6px;
        background: #667eea;
        border-radius: 3px;
        font-size: 10px;
        color: #fff;
      }
      #schema-output {
        margin: 0;
        padding: 10px;
        background: #1a1a1a;
        border-radius: 4px;
        font-size: 10px;
        line-height: 1.4;
        overflow-x: auto;
        max-height: 250px;
        overflow-y: auto;
      }
    `,t.appendChild(e);}attachHandlers(t){t.querySelector("#capture-btn")?.addEventListener("click",()=>{this.toggleCapture();}),t.querySelector("#export-btn")?.addEventListener("click",()=>{this.exportSchema();}),t.querySelector("#diff-btn")?.addEventListener("click",()=>{this.diffWithRepo();}),t.querySelector("#clear-btn")?.addEventListener("click",()=>{confirm("Clear all captured schema data?")&&(this.builder.clear(),this.renderTree(document.querySelector("#schema-tree-view")),this.renderPreview(document.querySelector("#schema-output")));});}toggleCapture(){this.isCapturing=!this.isCapturing;const t=document.querySelector("#capture-btn"),e=document.querySelector("#capture-text");this.isCapturing?(t.classList.add("active"),e.textContent="Stop Capture"):(t.classList.remove("active"),e.textContent="Start Capture");}exportSchema(){const t=this.builder.build(),e=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),s=URL.createObjectURL(e),o=document.createElement("a");o.href=s,o.download=`perplexity-api-${Date.now()}.json`,o.click(),URL.revokeObjectURL(s);}async diffWithRepo(){try{const t=await fetch("https://raw.githubusercontent.com/pv-udpv/pplx-spa-assets-knowledge/main/data/openapi.json");if(!t.ok){alert("Failed to fetch repo schema");return}const e=await t.json(),s=this.builder.diff(e);alert(`Schema Diff:

✅ Added: ${s.added.length} endpoints
⚠️ Modified: ${s.modified.length} endpoints
❌ Removed: ${s.removed.length} endpoints

`+(s.added.length>0?`
New endpoints:
${s.added.join(`
`)}`:""));}catch(t){alert(`Error: ${t.message}`);}}renderTree(t){const e=this.builder.getEndpoints();if(e.length===0){t.innerHTML='<p style="color: #aaa; font-size: 12px;">No endpoints captured yet. Browse Perplexity to discover APIs!</p>';return}t.innerHTML=e.map(s=>`
        <div class="endpoint-item">
          <span class="method method-${s.method.toLowerCase()}">${s.method}</span>
          <span class="path">${s.path}</span>
          <span class="badge">${s.responseCount} responses</span>
        </div>
      `).join("");}renderPreview(t){const e=this.builder.build();if(Object.keys(e.paths).length===0){t.textContent="No schema data available";return}t.textContent=JSON.stringify(e,null,2);}updateFromInterceptor(){this.renderTree(document.querySelector("#schema-tree-view")),this.renderPreview(document.querySelector("#schema-output"));}}class w{stats={totalRequests:0,avgLatency:0,errorRate:0};mount(t){t.innerHTML=`
      <div class="network-monitor">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Requests</span>
            <span class="stat-value" id="stat-total">0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Latency</span>
            <span class="stat-value" id="stat-latency">0ms</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Error Rate</span>
            <span class="stat-value" id="stat-errors">0%</span>
          </div>
        </div>
        
        <div class="actions">
          <button id="export-har-btn" class="action-btn">💾 Export HAR</button>
          <button id="clear-log-btn" class="action-btn danger">🗑️ Clear Log</button>
        </div>
        
        <div class="hint">
          <p>💡 <strong>Tip:</strong> Use built-in Eruda "Network" tab for detailed request inspection.</p>
          <p>This tab provides analytics & HAR export functionality.</p>
        </div>
      </div>
    `,this.attachStyles(t),this.attachHandlers(t),this.startMonitoring();}attachStyles(t){const e=document.createElement("style");e.textContent=`
      .network-monitor {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .stat-card {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .stat-label {
        font-size: 10px;
        color: #aaa;
        text-align: center;
      }
      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #667eea;
      }
      .hint {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        border-left: 3px solid #667eea;
      }
      .hint p {
        margin: 0;
        font-size: 11px;
        color: #aaa;
        line-height: 1.5;
      }
      .hint p:not(:last-child) {
        margin-bottom: 6px;
      }
      .hint strong {
        color: #fff;
      }
    `,t.appendChild(e);}attachHandlers(t){t.querySelector("#export-har-btn")?.addEventListener("click",()=>{this.exportHAR();}),t.querySelector("#clear-log-btn")?.addEventListener("click",()=>{confirm("Clear all network logs?")&&this.clearLog();});}startMonitoring(){setInterval(()=>{this.updateStats();},1e3);}updateStats(){try{const t=JSON.parse(localStorage.getItem("pplx-network-log")||"[]");if(this.stats.totalRequests=t.length,t.length>0){const r=t.map(n=>n.latency||0);this.stats.avgLatency=r.reduce((n,i)=>n+i,0)/r.length;const a=t.filter(n=>n.status>=400).length;this.stats.errorRate=a/t.length*100;}const e=document.querySelector("#stat-total"),s=document.querySelector("#stat-latency"),o=document.querySelector("#stat-errors");e&&(e.textContent=this.stats.totalRequests.toString()),s&&(s.textContent=`${Math.round(this.stats.avgLatency)}ms`),o&&(o.textContent=`${this.stats.errorRate.toFixed(1)}%`);}catch(t){console.error("[Network] Failed to update stats:",t);}}exportHAR(){try{const t=JSON.parse(localStorage.getItem("pplx-network-log")||"[]"),e={log:{version:"1.2",creator:{name:"Perplexity DevTool",version:"1.0.0"},entries:t.map(a=>({startedDateTime:a.timestamp||new Date().toISOString(),time:a.latency||0,request:{method:a.method||"GET",url:a.url||"",httpVersion:"HTTP/1.1",headers:[],queryString:[],cookies:[],headersSize:-1,bodySize:-1},response:{status:a.status||0,statusText:"",httpVersion:"HTTP/1.1",headers:[],cookies:[],content:{size:JSON.stringify(a.data||{}).length,mimeType:"application/json",text:JSON.stringify(a.data||{})},redirectURL:"",headersSize:-1,bodySize:-1},cache:{},timings:{send:0,wait:a.latency||0,receive:0}}))}},s=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),o=URL.createObjectURL(s),r=document.createElement("a");r.href=o,r.download=`perplexity-${Date.now()}.har`,r.click(),URL.revokeObjectURL(o);}catch(t){alert(`Export failed: ${t.message}`);}}clearLog(){localStorage.removeItem("pplx-network-log"),this.stats={totalRequests:0,avgLatency:0,errorRate:0},this.updateStats();}}class k{prefix="pplx-devtool-";get(t,e){try{const s=localStorage.getItem(this.prefix+t);return s===null?e:JSON.parse(s)}catch(s){return console.error("[Storage] Failed to get:",t,s),e}}set(t,e){try{localStorage.setItem(this.prefix+t,JSON.stringify(e));}catch(s){console.error("[Storage] Failed to set:",t,s);}}remove(t){try{localStorage.removeItem(this.prefix+t);}catch(e){console.error("[Storage] Failed to remove:",t,e);}}clear(){try{const t=Object.keys(localStorage).filter(e=>e.startsWith(this.prefix));for(const e of t)localStorage.removeItem(e);}catch(t){console.error("[Storage] Failed to clear:",t);}}}class T{storage=new k;mount(t){const e=this.loadConfig();t.innerHTML=`
      <div class="settings">
        <div class="setting-group">
          <h4>🔐 GitHub Integration</h4>
          <label>
            <span>Personal Access Token</span>
            <input type="password" id="github-pat" placeholder="ghp_xxxxx" value="${e.githubPAT||""}">
          </label>
          <label>
            <span>Repository</span>
            <input type="text" id="github-repo" value="${e.githubRepo||"pv-udpv/pplx-spa-assets-knowledge"}" readonly>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="auto-sync" ${e.autoSync?"checked":""}>
            <span>Auto-sync captures to GitHub</span>
          </label>
        </div>
        
        <div class="setting-group">
          <h4>⚙️ Capture Settings</h4>
          <label class="checkbox">
            <input type="checkbox" id="capture-fetch" ${e.captureFetch!==false?"checked":""}>
            <span>Intercept fetch() requests</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="capture-xhr" ${e.captureXHR!==false?"checked":""}>
            <span>Intercept XMLHttpRequest</span>
          </label>
          <label class="checkbox">
            <input type="checkbox" id="capture-ws" ${e.captureWS?"checked":""}>
            <span>Intercept WebSocket (experimental)</span>
          </label>
        </div>
        
        <div class="setting-group">
          <h4>🎨 UI Settings</h4>
          <label>
            <span>Button Position</span>
            <button id="reset-position-btn" class="action-btn">Reset Position</button>
          </label>
        </div>
        
        <div class="actions">
          <button id="save-btn" class="action-btn primary">💾 Save Settings</button>
          <button id="reset-btn" class="action-btn danger">🔄 Reset All</button>
        </div>
        
        <div class="info">
          <p><strong>DevTool Version:</strong> 1.0.0</p>
          <p><strong>Eruda Version:</strong> 3.0.1</p>
          <p><strong>Build:</strong> vite-plugin-monkey</p>
        </div>
      </div>
    `,this.attachStyles(t),this.attachHandlers(t);}attachStyles(t){const e=document.createElement("style");e.textContent=`
      .settings {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .setting-group {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
      }
      .setting-group h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #667eea;
      }
      .setting-group label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 12px;
        font-size: 12px;
      }
      .setting-group label:last-child {
        margin-bottom: 0;
      }
      .setting-group label span {
        color: #aaa;
      }
      .setting-group input[type="text"],
      .setting-group input[type="password"] {
        padding: 8px;
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        color: #fff;
        font-size: 12px;
      }
      .setting-group label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      .setting-group input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      .info {
        padding: 12px;
        background: #2a2a2a;
        border-radius: 8px;
        font-size: 11px;
        color: #aaa;
      }
      .info p {
        margin: 0;
        padding: 4px 0;
      }
      .info strong {
        color: #fff;
      }
    `,t.appendChild(e);}attachHandlers(t){t.querySelector("#save-btn")?.addEventListener("click",()=>{this.saveConfig();}),t.querySelector("#reset-btn")?.addEventListener("click",()=>{confirm("Reset all settings to default?")&&this.resetConfig();}),t.querySelector("#reset-position-btn")?.addEventListener("click",()=>{localStorage.removeItem("pplx-sticky-btn-position"),alert("Button position reset. Refresh page to apply.");});}loadConfig(){return {githubPAT:this.storage.get("github-pat",""),githubRepo:this.storage.get("github-repo","pv-udpv/pplx-spa-assets-knowledge"),autoSync:this.storage.get("auto-sync",false),captureFetch:this.storage.get("capture-fetch",true),captureXHR:this.storage.get("capture-xhr",true),captureWS:this.storage.get("capture-ws",false)}}saveConfig(){const t=document.querySelector("#github-pat").value,e=document.querySelector("#auto-sync").checked,s=document.querySelector("#capture-fetch").checked,o=document.querySelector("#capture-xhr").checked,r=document.querySelector("#capture-ws").checked;this.storage.set("github-pat",t),this.storage.set("auto-sync",e),this.storage.set("capture-fetch",s),this.storage.set("capture-xhr",o),this.storage.set("capture-ws",r),alert("✅ Settings saved!");}resetConfig(){this.storage.clear(),alert("✅ Settings reset. Refresh page to apply.");}}const E={user:{description:"Endpoints related to user",endpoints:[{method:"GET",path:"/rest/user/settings",operationId:"get__rest_user_settings",summary:"GET /rest/user/settings",parameters:[],has_request_body:false},{method:"GET",path:"/rest/user/info",operationId:"get__rest_user_info",summary:"GET /rest/user/info",parameters:[],has_request_body:false}]},thread:{description:"Endpoints related to thread",endpoints:[{method:"GET",path:"/rest/thread/list_recent",operationId:"get__rest_thread_list_recent",summary:"GET /rest/thread/list_recent",parameters:[],has_request_body:false}]},tasks:{description:"Endpoints related to tasks",endpoints:[{method:"GET",path:"/rest/tasks/shortcuts/mentions",operationId:"get__rest_tasks_shortcuts_mentions",summary:"GET /rest/tasks/shortcuts/mentions",parameters:[],has_request_body:false}]},other:{description:"Endpoints related to other",endpoints:[{method:"GET",path:"/api/auth/session",operationId:"get__api_auth_session",summary:"GET /api/auth/session",parameters:[],has_request_body:false},{method:"GET",path:"/rest/ping",operationId:"get__rest_ping",summary:"GET /rest/ping",parameters:[],has_request_body:false}]}};class C{name="Perplexity";api;coverage;builder;interceptors;schemaTab;constructor(){this.api=new f,this.coverage=new m,this.builder=new y,this.interceptors=new x,this.loadSchema();}init(t){t.innerHTML=`
      <div class="pplx-devtool">
        <div class="pplx-tabs">
          <button class="pplx-tab active" data-tab="api">📦 API</button>
          <button class="pplx-tab" data-tab="schema">📋 Schema</button>
          <button class="pplx-tab" data-tab="network">🌐 Network</button>
          <button class="pplx-tab" data-tab="settings">⚙️ Settings</button>
        </div>
        <div class="pplx-content">
          <div class="pplx-tab-content active" id="tab-api"></div>
          <div class="pplx-tab-content" id="tab-schema"></div>
          <div class="pplx-tab-content" id="tab-network"></div>
          <div class="pplx-tab-content" id="tab-settings"></div>
        </div>
      </div>
    `,this.attachStyles(t),this.attachTabHandlers(t),this.mountTabs(t),this.startInterceptors();}attachStyles(t){const e=document.createElement("style");e.textContent=`
      .pplx-devtool {
        padding: 12px;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .pplx-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
      }
      .pplx-tab {
        background: transparent;
        border: none;
        color: #aaa;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .pplx-tab:hover {
        background: #333;
        color: #fff;
      }
      .pplx-tab.active {
        background: #667eea;
        color: #fff;
      }
      .pplx-tab-content {
        display: none;
      }
      .pplx-tab-content.active {
        display: block;
      }
      .actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
      .action-btn {
        padding: 8px 12px;
        background: #667eea;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .action-btn:hover {
        background: #5568d3;
      }
      .action-btn.primary {
        background: #49cc90;
        grid-column: span 2;
      }
      .action-btn.primary:hover {
        background: #3bb77e;
      }
      .action-btn.danger {
        background: #f93e3e;
      }
      .action-btn.danger:hover {
        background: #e02929;
      }
    `,t.appendChild(e);}attachTabHandlers(t){t.querySelectorAll(".pplx-tab").forEach(e=>{e.addEventListener("click",s=>{const o=s.target.dataset.tab;o&&this.switchTab(t,o);});});}switchTab(t,e){t.querySelectorAll(".pplx-tab").forEach(s=>s.classList.remove("active")),t.querySelectorAll(".pplx-tab-content").forEach(s=>s.classList.remove("active")),t.querySelector(`[data-tab="${e}"]`)?.classList.add("active"),t.querySelector(`#tab-${e}`)?.classList.add("active");}mountTabs(t){new v(this.api,this.coverage).mount(t.querySelector("#tab-api")),this.schemaTab=new S(this.builder),this.schemaTab.mount(t.querySelector("#tab-schema")),new w().mount(t.querySelector("#tab-network")),new T().mount(t.querySelector("#tab-settings"));}loadSchema(){const t=[];for(const[e,s]of Object.entries(E)){for(const o of s.endpoints)t.push({method:o.method,path:o.path,category:e,operationId:o.operationId,summary:o.summary,parameters:o.parameters,has_request_body:o.has_request_body});this.coverage.initCategory(e,s.endpoints.map(o=>({method:o.method,path:o.path})));}this.api.setEndpoints(t);}startInterceptors(){this.interceptors.onIntercept((t,e,s,o,r)=>{if(!e.includes("perplexity.ai"))return;const a=new URL(e),n=a.pathname+a.search;this.coverage.markCalled(t,n,s,r),this.builder.addEndpoint(n,t,{status:s,body:o,latency:r}),this.schemaTab&&typeof this.schemaTab.updateFromInterceptor=="function"&&this.schemaTab.updateFromInterceptor();try{const i=JSON.parse(localStorage.getItem("pplx-network-log")||"[]");i.push({timestamp:new Date().toISOString(),method:t,url:e,status:s,data:o,latency:r}),i.length>100&&i.shift(),localStorage.setItem("pplx-network-log",JSON.stringify(i));}catch(i){console.error("[Interceptor] Failed to log request:",i);}}),this.interceptors.start();}destroy(){this.interceptors.stop();}}class L{button=null;isDragging=false;wasDragging=false;offsetX=0;offsetY=0;storageKey="pplx-sticky-btn-position";onClickCallback;constructor(t={}){this.onClickCallback=t.onClick||(()=>{});}init(){this.create(),this.restore(),this.attachEvents();}create(){this.button=document.createElement("button"),this.button.id="pplx-sticky-btn",this.button.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
              stroke="currentColor" stroke-width="2"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" 
              stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>API</span>
    `,this.button.style.cssText=`
      position: fixed;
      width: 60px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      color: #fff;
      cursor: grab;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      touch-action: none;
    `,document.body.appendChild(this.button);}attachEvents(){this.button&&(this.button.addEventListener("mousedown",this.onDragStart.bind(this)),document.addEventListener("mousemove",this.onDrag.bind(this)),document.addEventListener("mouseup",this.onDragEnd.bind(this)),this.button.addEventListener("touchstart",this.onDragStart.bind(this),{passive:false}),document.addEventListener("touchmove",this.onDrag.bind(this),{passive:false}),document.addEventListener("touchend",this.onDragEnd.bind(this)),this.button.addEventListener("click",()=>{this.wasDragging||this.onClickCallback(),this.wasDragging=false;}),window.addEventListener("resize",()=>{this.snapToEdge(false);}));}onDragStart(t){if(t.preventDefault(),!this.button)return;this.isDragging=true,this.wasDragging=false,this.button.style.cursor="grabbing",this.button.style.transition="none";const e="touches"in t?t.touches[0]:t,s=this.button.getBoundingClientRect();this.offsetX=e.clientX-s.left,this.offsetY=e.clientY-s.top;}onDrag(t){if(!this.isDragging||!this.button)return;t.preventDefault(),this.wasDragging=true;const e="touches"in t?t.touches[0]:t,s=e.clientX-this.offsetX,o=e.clientY-this.offsetY,r=window.innerWidth-this.button.offsetWidth,a=window.innerHeight-this.button.offsetHeight,n=Math.max(0,Math.min(s,r)),i=Math.max(0,Math.min(o,a));this.button.style.left=n+"px",this.button.style.top=i+"px",this.button.style.right="auto",this.button.style.bottom="auto";}onDragEnd(){!this.isDragging||!this.button||(this.isDragging=false,this.button.style.cursor="grab",this.button.style.transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",this.snapToEdge(),this.save());}snapToEdge(t=true){if(!this.button)return;const e=this.button.getBoundingClientRect(),s=e.left+e.width/2,o=e.top+e.height/2,r=window.innerWidth,a=window.innerHeight,n={left:s,right:r-s,top:o,bottom:a-o},i=Object.keys(n).reduce((l,p)=>n[l]<n[p]?l:p);switch(t||(this.button.style.transition="none"),i){case "left":this.button.style.left="20px",this.button.style.right="auto",this.button.style.top=e.top+"px",this.button.style.bottom="auto";break;case "right":this.button.style.right="20px",this.button.style.left="auto",this.button.style.top=e.top+"px",this.button.style.bottom="auto";break;case "top":this.button.style.top="20px",this.button.style.bottom="auto",this.button.style.left=e.left+"px",this.button.style.right="auto";break;case "bottom":this.button.style.bottom="20px",this.button.style.top="auto",this.button.style.left=e.left+"px",this.button.style.right="auto";break}t||setTimeout(()=>{this.button&&(this.button.style.transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)");},50);}save(){if(!this.button)return;const t={left:this.button.style.left,right:this.button.style.right,top:this.button.style.top,bottom:this.button.style.bottom,timestamp:Date.now()};localStorage.setItem(this.storageKey,JSON.stringify(t));}restore(){const t=localStorage.getItem(this.storageKey);if(t&&this.button)try{const e=JSON.parse(t);this.button.style.left=e.left,this.button.style.right=e.right,this.button.style.top=e.top,this.button.style.bottom=e.bottom;}catch(e){console.error("[PPLX Sticky] Failed to restore position:",e),this.setDefaultPosition();}else this.setDefaultPosition();}setDefaultPosition(){this.button&&(this.button.style.right="20px",this.button.style.top="50%",this.button.style.transform="translateY(-50%)");}}const g=/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);document.readyState==="loading"?document.addEventListener("DOMContentLoaded",b):b();function b(){const c=window.eruda;if(typeof c>"u"){console.error("[Perplexity DevTool] Eruda not loaded!");return}c.init({useShadowDom:true,autoScale:true,defaults:{displaySize:g?40:50,transparency:.95},tool:["console","elements","network","resources","sources"]});const t=new C;c.add(t),new L({onClick:()=>{c.show("Perplexity");}}).init(),console.log("%c⚡ Perplexity DevTool loaded!","color: #667eea; font-size: 16px; font-weight: bold"),console.log(`%cPlatform: ${g?"Mobile":"Desktop"} | Eruda: Ready`,"color: #49cc90; font-size: 12px"),console.log("%cDrag the purple button to reposition | Click to open DevTool","color: #aaa; font-size: 11px");}

})();