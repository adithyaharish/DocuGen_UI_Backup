// RequirementsDownloader.js (Updated with priority file detection)

export const downloadRequirements = async (githubUrl) => {
  if (!githubUrl) {
    alert("GitHub URL missing");
    return;
  }

  const { owner, repo, branch } = extractGitHubDetails(githubUrl);
  if (!owner || !repo) {
    alert("Invalid GitHub URL");
    return;
  }

  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    const treeData = await treeRes.json();
    const filePaths = treeData.tree?.map((f) => f.path) || [];
    const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

    // Priority 1: Python - requirements.txt
    if (filePaths.includes("requirements.txt")) {
      return downloadRawFile(`${rawBase}/requirements.txt`, "requirements.txt");
    }

    // Priority 2: JS/TS - package.json
    if (filePaths.includes("package.json")) {
      const res = await fetch(`${rawBase}/package.json`);
      const pkg = await res.json();
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};
      const lines = Object.entries({ ...deps, ...devDeps }).map(([pkg, ver]) => `${pkg}@${ver}`);
      return triggerDownload(lines.join("\n"), "requirements.txt");
    }

    // Priority 3: Java - pom.xml or build.gradle (fetch but don't parse deeply)
    const javaFile = filePaths.find(p => p === "pom.xml" || p === "build.gradle");
    if (javaFile) {
      return downloadRawFile(`${rawBase}/${javaFile}`, javaFile);
    }

    // Fallback: parse imports from .py, .js, .ts, .java files
    const languageFiles = filePaths.filter(
      (path) => path.endsWith(".py") || path.endsWith(".js") || path.endsWith(".ts") || path.endsWith(".java")
    );

    const imports = new Set();
    for (const path of languageFiles) {
      const res = await fetch(`${rawBase}/${path}`);
      const text = await res.text();
      extractImports(path, text).forEach((imp) => imports.add(imp));
    }

    triggerDownload(Array.from(imports).join("\n"), "requirements.txt");

  } catch (err) {
    console.error("Error generating requirements:", err);
    alert("Failed to generate requirements.txt");
  }
};

function extractGitHubDetails(url) {
  const match = url.match(/github.com\/(.*?)\/(.*?)(?:\/(tree|blob)\/([^\/]+))?(?:\/.+)?$/);
  if (!match) return {};
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
    branch: match[4] || "main",
  };
}

function extractImports(filePath, content) {
  const imports = new Set();
  const lines = content.split("\n");

  if (filePath.endsWith(".py")) {
    lines.forEach((line) => {
      if (line.startsWith("import ") || line.startsWith("from ")) {
        const parts = line.replace(/import|from/g, "").trim().split(" ")[0].split(".")[0];
        if (parts) imports.add(parts);
      }
    });
  } else if (filePath.endsWith(".js") || filePath.endsWith(".ts")) {
    lines.forEach((line) => {
      if (line.includes("require(") || line.includes("import ")) {
        const match = line.match(/['"]([^'"]+)['"]/);
        if (match && !match[1].startsWith(".")) imports.add(match[1]);
      }
    });
  } else if (filePath.endsWith(".java")) {
    lines.forEach((line) => {
      if (line.startsWith("import ")) {
        const parts = line.replace("import", "").trim().split(".")[0];
        if (parts) imports.add(parts);
      }
    });
  }

  return Array.from(imports);
}

function downloadRawFile(url, filename) {
  fetch(url)
    .then(res => res.text())
    .then(content => triggerDownload(content, filename))
    .catch(err => {
      console.error("Failed to fetch raw file:", err);
      alert("Error downloading dependency file");
    });
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
