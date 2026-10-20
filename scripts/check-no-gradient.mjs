import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const TARGET_DIRS = [
  path.join(rootDir, "client", "src"),
  path.join(rootDir, "server", "src"),
]

const TARGET_FILES = [
  path.join(rootDir, "client", "index.html"),
]

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".svg", ".mjs"])

const FORBIDDEN_PATTERNS = [
  {
    name: "CSS or word 'gradient'",
    regex: /\bgradient\b/i,
  },
  {
    name: "Tailwind linear/radial/conic gradient classes",
    regex: /\b(bg|mask)-(linear|radial|conic)\b/i,
  },
  {
    name: "Canvas gradient methods",
    regex: /\b(createLinearGradient|createRadialGradient|createConicGradient)\b/i,
  },
  {
    name: "SVG gradient tags",
    regex: /<\/?(linearGradient|radialGradient)\b/i,
  },
]

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const violations = []

  lines.forEach((line, index) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          rule: pattern.name,
          text: line.trim(),
        })
      }
    }
  })

  return violations
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return []
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
        files.push(...walkDir(fullPath))
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (EXTENSIONS.has(ext)) {
        files.push(fullPath)
      }
    }
  }
  return files
}

const allFilesToScan = new Set()

for (const dir of TARGET_DIRS) {
  for (const file of walkDir(dir)) {
    allFilesToScan.add(file)
  }
}

for (const file of TARGET_FILES) {
  if (fs.existsSync(file)) {
    allFilesToScan.add(file)
  }
}

let totalViolations = 0

console.log(`[check-no-gradient] Scanning ${allFilesToScan.size} files for gradient rules...`)

for (const filePath of allFilesToScan) {
  const violations = scanFile(filePath)
  if (violations.length > 0) {
    totalViolations += violations.length
    for (const v of violations) {
      console.error(`VIOLATION in ${v.file}:${v.line} -> [${v.rule}] "${v.text}"`)
    }
  }
}

if (totalViolations > 0) {
  console.error(`\n[check-no-gradient] FAILED: Found ${totalViolations} gradient violation(s)!`)
  process.exit(1)
} else {
  console.log(`[check-no-gradient] PASSED: No gradients found in scanned files.`)
}
