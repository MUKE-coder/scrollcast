# Penetration Testing

## TL;DR
- A penetration test (pentest) is an authorized, simulated cyberattack against a system to find exploitable weaknesses before real attackers do.
- It follows a disciplined lifecycle — scope and rules of engagement, reconnaissance, scanning, exploitation, post-exploitation, and reporting — so findings are repeatable and defensible.
- It is distinct from a vulnerability scan: scans list *possible* weaknesses; a pentest *proves* impact by chaining them into a working attack path.
- Common engagement styles are black-box (no prior info), gray-box (some info, e.g. a low-priv account), and white-box (full source/architecture access).
- The deliverable is a report with reproducible evidence, business impact, CVSS-style severity, and prioritized remediation — not just a list of CVEs.

## What it is
A penetration test is an authorized security assessment in which testers act as adversaries against a defined target — a web app, an API, a network segment, a mobile app, a cloud account, or a physical site — within strict legal and operational boundaries. The goal is to demonstrate real-world risk: not only "this version of nginx is outdated" but "this outdated nginx, combined with a writable upload path and an unscoped IAM role, lets us read every customer's invoice."

The core mental model is the **attack chain**: a single vulnerability rarely matters; multiple low-severity flaws chained together produce critical impact. Defenders think in lists of CVEs; pentesters think in paths from entry point to objective.

Key terms:
- **Scope:** the systems, IPs, accounts, and time windows in-bounds.
- **Rules of engagement (RoE):** allowed techniques, disallowed actions (e.g. no DoS, no data exfil), emergency contacts.
- **Asset:** any system or data the target cares about.
- **Vulnerability:** a flaw that *could* be exploited.
- **Exploit:** code or technique that *does* exploit it.
- **Payload:** what runs after the exploit succeeds (e.g. a reverse shell, a webshell, a token grab).
- **Indicator of Compromise (IoC):** an artifact a defender could detect.
- **Red team vs pentest:** a red team is goal-oriented and stealthy over weeks; a pentest is breadth-oriented within a fixed window.

Where it fits in the bigger picture: pentesting is one layer of a broader security program that also includes vulnerability management (continuous), code review (per-PR), threat modeling (per-design), bug bounty (continuous, crowdsourced), and red teaming (goal-driven, stealthy). A pentest gives a structured, time-boxed adversarial check against a defined target.

## Why it matters
Defenders can't audit every line of code, every dependency, and every misconfiguration; attackers only need one path. A pentest closes that asymmetry by paying experts to *find* a path before an attacker does. Concrete consequences:
- A single overlooked SQL injection in a checkout endpoint has, in real reported breaches, exposed millions of customer records and triggered seven- to nine-figure regulatory fines under GDPR / CCPA / HIPAA.
- An unpatched server-side request forgery (SSRF) in a cloud-hosted app has repeatedly leaked AWS IAM credentials via the metadata service (IMDSv1), giving attackers role-level access to S3 and KMS within minutes.
- A weak SSO assertion or missing audience-check on a SAML response has allowed full account takeover with no password ever touched.

Who uses it:
- **Regulated organizations** (PCI-DSS, HIPAA, SOC 2, ISO 27001) — pentests are often required at least annually and after major changes.
- **Product companies before launch** — to ship without a known critical.
- **M&A diligence** — to evaluate the security posture of an acquisition target.
- **Government / critical infrastructure** — under specific frameworks (FedRAMP, NIS2, etc.).

Common misconceptions to correct:
- "We ran a vuln scan, we're good." A scanner finds known signatures; it does not chain flaws or reason about business logic.
- "Pentests guarantee security." A pentest is a point-in-time check of a defined scope by a fixed-size team. Anything out of scope, anything introduced afterward, and anything the team missed is still exposed.
- "If they didn't break in, we passed." Negative results matter only relative to effort. A two-day pentest finding nothing is not the same signal as a two-week one.
- "Automated tools can do this." Tools assist heavily, but human reasoning about business logic, trust boundaries, and chained impact is what produces critical findings.

## How it's done
A pentest follows a defined lifecycle. Each step has a deliverable and feeds the next.

### Step 1 — Scoping and Rules of Engagement
What happens: tester and client agree, in writing, on what is in scope (IPs, domains, accounts, mobile apps, cloud tenants), what is out of scope, what techniques are allowed (no DoS, no social engineering unless explicitly approved, no data destruction), the testing window, off-hours rules, emergency contacts, and a "stop test" channel. A signed Authorization to Test letter is collected — without it, the test is illegal.

Visual idea: a contract document on the left, an arrow into a fenced "in-scope" box (containing three server icons and one cloud icon) on the right. Out-of-scope items are shown greyed out behind a dotted line. A small "Authorization to Test" badge appears with a signature animation.

Tools / techniques used in practice: signed SoW (statement of work), RoE document, scope tracker spreadsheet, IP allowlist on the client's WAF/IDS to permit test traffic.

### Step 2 — Reconnaissance
What happens: gather publicly-available information about the target without sending suspicious traffic — domains, subdomains, exposed services, technologies in use, leaked credentials, employee names for context. Passive recon uses third-party data (DNS, certificate transparency logs, search engines, GitHub); active recon sends light probes (DNS queries, port scans within scope).

Visual idea: a center node labelled with the target's domain; lines radiate out to small cards representing subdomains, cert transparency logs, exposed S3 buckets, leaked credentials in pastebin-style sources, and GitHub repos. Each card animates in one at a time.

```bash
# Enumerate subdomains using passive sources (no traffic to target).
subfinder -d example.com -silent | tee subs.txt

# Resolve and probe which are live over HTTP(S).
cat subs.txt | dnsx -silent -a -resp-only | httpx -silent -title -tech-detect
```

Tools: `subfinder`, `amass`, `dnsx`, `httpx`, certificate transparency search (crt.sh), `trufflehog` for leaked secrets in public GitHub.

### Step 3 — Scanning and Enumeration
What happens: against in-scope hosts, identify open ports, running service versions, web routes, parameters, and authentication mechanisms. This is the bridge from "what exists" to "what might be exploitable."

Visual idea: a vertical list of ports (22, 80, 443, 3306, 8080) with each row revealing a service banner ("OpenSSH 9.0", "nginx 1.18.0", "MySQL 8.0", "Tomcat 9 — login page"). A side panel shows a directory tree the scanner is enumerating: `/login`, `/api/v1/users`, `/admin`, `/.git/HEAD`.

```bash
# Service version scan, all TCP ports, default safe scripts.
nmap -sV -sC -p- --min-rate 1000 -oA nmap-full 10.0.0.42

# Directory and parameter enumeration on a discovered web app.
ffuf -u https://target.example.com/FUZZ \
     -w /usr/share/wordlists/dirb/common.txt \
     -mc 200,301,302,401,403
```

Tools: `nmap`, `masscan`, `ffuf`, `gobuster`, Burp Suite Pro's site map crawl, `nuclei` for known-vuln templates.

### Step 4 — Vulnerability Analysis
What happens: take the enumerated surface and reason about where it could be broken. This is more than running a scanner: it is reading auth flows for missing checks, looking at IDs in URLs for IDOR, testing input validation manually, reviewing the OWASP Top 10 (injection, broken access control, SSRF, deserialization, etc.) against each endpoint. Findings are recorded with proof of where the flaw lives, not yet what it would do.

Visual idea: a table with three columns — Surface (e.g. "POST /api/v1/orders"), Hypothesis (e.g. "missing tenant check, IDOR on order_id"), and Evidence (e.g. "request with another tenant's order_id returned 200 + body"). Rows fill in one at a time, color-coded by severity.

Tools: Burp Suite (Proxy, Repeater, Intruder), browser devtools, manual request crafting, OWASP testing checklists.

### Step 5 — Exploitation
What happens: prove the impact. The tester chains the flaws found in Step 4 into a working attack path — for example, an unauthenticated SSRF that hits the cloud metadata endpoint, retrieves IAM credentials, and uses them to list S3 buckets containing PII. Exploits are run only within the agreed RoE, and destructive payloads are avoided (read, don't write or delete).

Visual idea: a sequence of three boxes left-to-right — "Unauthenticated SSRF endpoint" → "Hits 169.254.169.254 metadata" → "AWS access key retrieved" → "Lists bucket: customer-invoices-prod". Arrows animate in one by one, with a small lock icon turning open at each step.

```python
import requests

# Demonstrates SSRF retrieving instance metadata credentials.
# Run only against systems you are authorized to test.
target = "https://app.example.com/api/fetch"
metadata_url = "http://169.254.169.254/latest/meta-data/iam/security-credentials/"

r = requests.get(target, params={"url": metadata_url}, timeout=10)
role = r.text.strip().splitlines()[0]
creds = requests.get(target, params={"url": metadata_url + role}, timeout=10).json()

print("AccessKeyId:", creds["AccessKeyId"])
print("Expiration:", creds["Expiration"])
```

Tools: Burp Suite Repeater, `curl`, custom Python scripts, Metasploit (sparingly, mostly for known network exploits), `sqlmap` for confirmed SQLi, `responder` for network captures.

### Step 6 — Post-Exploitation
What happens: with initial access, the tester evaluates how far the access reaches — lateral movement, privilege escalation, persistence (if RoE allows), and data the attacker could now reach. The point is not to pwn everything; it is to measure blast radius so the report can say "this one flaw led to read access to N customer records" in concrete terms.

Visual idea: a network map. Initial foothold node is highlighted; lines extend to other nodes as the tester demonstrates lateral access (`web-app` → `internal-api` → `database`). At each hop, a small "evidence" pane shows the captured screenshot or token.

```bash
# After obtaining an IAM key, enumerate accessible AWS resources.
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

aws sts get-caller-identity
aws s3 ls
aws iam list-attached-role-policies --role-name app-prod-role
```

Tools: `bloodhound` for AD environments, `pacu` for AWS post-exploitation, `mimikatz` (Windows), `linpeas` / `winpeas` for privilege-escalation checks.

### Step 7 — Reporting
What happens: every finding is written up with a clear title, severity (often CVSS v3.1), affected component, reproduction steps, evidence (screenshots, request/response pairs), business impact in the client's own terms, and a specific remediation. An executive summary gives the C-suite the headline; a technical section gives engineers everything they need to fix and verify.

Visual idea: a report cover page slides in, then opens to a two-column layout. Left: an "Executive summary" panel with a red/amber/green chart of findings by severity. Right: a finding template with sections (Title, CVSS, Reproduction, Impact, Remediation) filling in line-by-line.

```markdown
## Finding F-07 — Server-Side Request Forgery in /api/fetch
**Severity:** Critical (CVSS 9.1)
**Affected:** app.example.com — endpoint POST /api/fetch (url parameter)
**Reproduction:**
  1. Log in as any user.
  2. POST {"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}
  3. Response contains the EC2 IAM role name.
  4. Re-issue with /role-name appended to retrieve temporary AWS credentials.
**Impact:** Retrieved AWS credentials grant read access to S3 bucket
  `customer-invoices-prod` (47,812 invoice PDFs sampled).
**Remediation:** Validate user-supplied URLs against an allowlist of hosts;
  block link-local (169.254.0.0/16) and private (RFC 1918) ranges;
  enforce IMDSv2 (token-required) on EC2 instances.
```

Tools: report templates, CVSS calculator (FIRST.org), `dradis` / `serpico` / `plextrac` for report compilation.

### Step 8 — Retest
What happens: after the client remediates, the tester verifies each finding is actually fixed — not just acknowledged. Retests are scoped and short, but essential: a "fixed" finding that wasn't actually fixed is worse than not retesting.

Visual idea: the report's findings list reappears; each row toggles from "Open" to "Verified Fixed" (green) or "Still Vulnerable" (red) as the tester re-runs the reproduction.

Tools: the same reproductions from the report, plus a retest log appended to the deliverable.

## Key comparisons

| | Vulnerability Scan | Penetration Test | Red Team Exercise |
|---|---|---|---|
| Goal | List known weaknesses | Prove exploitable impact | Test detection & response |
| Duration | Minutes to hours, continuous | 1–4 weeks, time-boxed | Weeks to months, stealthy |
| Output | CVE list, severity by CVSS | Chained findings + business impact | Adversary emulation report |
| Defender awareness | Known | Known | Blind (usually) |
| Best when | You want continuous coverage | You want a thorough check of a defined scope | You want to test your SOC |

Black-box vs gray-box vs white-box (within a pentest):
- **Black-box** — tester gets only what an external attacker would have. Realistic, but more time spent on recon and less on depth.
- **Gray-box** — tester gets a low-privilege account and basic architecture info. Best ROI for most web/API engagements.
- **White-box** — tester gets source, configs, architecture. Highest depth; closest to a code-review-plus-pentest hybrid.

## Recap
- A pentest is an authorized, simulated attack that proves impact, not just lists weaknesses.
- It follows a disciplined lifecycle: scope → recon → scan → analyze → exploit → post-exploit → report → retest.
- The deliverable's value lies in reproducible evidence, real business impact, and specific remediation — written for both executives and engineers.
- A pentest is one piece of a security program; pair it with scanning, code review, threat modeling, and (where applicable) red teaming.
- Most critical findings come from *chains* of low-severity issues, not from a single CVE.

## Suggested visuals
- An attack chain diagram showing SSRF → IMDS → IAM key → S3 PII, with arrows drawing on one by one.
- A vertical lifecycle of the 8 phases (Scope → Retest) as a numbered timeline.
- A network map with initial foothold highlighted and lateral movement paths animating outward.
- A side-by-side table comparing Vulnerability Scan vs Penetration Test vs Red Team.
- An "in scope vs out of scope" fenced diagram with a signed Authorization-to-Test badge.
- A reconnaissance hub: target node in the center, subdomain / cert-log / GitHub / leaked-creds nodes radiating out.
- A code editor scene of the SSRF Python proof-of-concept being typed live.
- A report cover sliding open into a two-column finding template with severity color bars.
