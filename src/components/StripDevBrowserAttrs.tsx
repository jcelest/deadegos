import Script from "next/script";

/**
 * Cursor's embedded browser injects data-cursor-ref attributes for automation.
 * Those attributes are not in the React tree, which triggers hydration warnings.
 * This script removes them before React hydrates.
 */
export default function StripDevBrowserAttrs() {
  return (
    <Script id="strip-dev-browser-attrs" strategy="beforeInteractive">
      {`(function(){function strip(){document.querySelectorAll("[data-cursor-ref]").forEach(function(el){el.removeAttribute("data-cursor-ref")})}strip();if(typeof MutationObserver!=="undefined"){var observer=new MutationObserver(strip);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["data-cursor-ref"]});document.addEventListener("DOMContentLoaded",function(){strip();observer.disconnect()},{once:true})}})();`}
    </Script>
  );
}
