const menuButton=document.querySelector(".menu-toggle");
const nav=document.querySelector("#nav");
menuButton?.addEventListener("click",()=>{const open=nav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menuButton?.setAttribute("aria-expanded","false");}));

const revealEls=document.querySelectorAll(".reveal");
if("IntersectionObserver" in window){
 const revealObserver=new IntersectionObserver((entries,observer)=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}}),{threshold:.12});
 revealEls.forEach(el=>revealObserver.observe(el));
}else revealEls.forEach(el=>el.classList.add("visible"));

// Set these two URLs before publishing.
const LINKS={discord:"YOUR_DISCORD_SERVER_INVITE_URL",invite:"YOUR_BOT_INVITE_URL"};
document.querySelectorAll(".discord-link").forEach(a=>{a.href=LINKS.discord;a.addEventListener("click",e=>{if(LINKS.discord.includes("YOUR_")){e.preventDefault();alert("Add your Discord server invite URL in script.js before publishing.");}})});
document.querySelectorAll(".invite-link").forEach(a=>{a.href=LINKS.invite;a.addEventListener("click",e=>{if(LINKS.invite.includes("YOUR_")){e.preventDefault();alert("Add your bot invite URL in script.js before publishing.");}})});
