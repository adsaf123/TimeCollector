// Load files

for (file in modInfo.modFiles) {
    let script = document.createElement("script");
    script.setAttribute("src", "js/" + modInfo.modFiles[file]);
    script.setAttribute("async", "false");
    script.setAttribute("type", "module");
    document.head.insertBefore(script, document.getElementById("temp"));
}

