# Security Policy

## Supported Versions

The table below indicates which versions of OpenHostel receive security updates.

| Version                    | Supported |
| -------------------------- | --------- |
| MVP v1 (main)              | ✅ Yes     |
| Older development branches | ❌ No      |

Only the latest stable version is guaranteed to receive security fixes.

---

# Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub Issue**.

Instead, report it privately to the project maintainers.

Your report should include:

* Description of the vulnerability
* Steps to reproduce
* Potential impact
* Screenshots or proof of concept (if applicable)
* Suggested mitigation (optional)

Please provide enough information for maintainers to reproduce the issue.

---

# Response Process

We aim to follow this workflow:

1. Vulnerability received
2. Acknowledgement by maintainers
3. Investigation and verification
4. Security patch development
5. Internal testing
6. Public release of the fix
7. Responsible disclosure

We will make reasonable efforts to respond as quickly as possible.

---

# Scope

Examples of vulnerabilities that should be reported include:

### Authentication

* Login bypass
* Password reset vulnerabilities
* Session hijacking
* Role escalation

### Authorization

* Student accessing vendor data
* Vendor accessing another hostel
* Caretaker privilege escalation
* Admin permission bypass

### Data Security

* Unauthorized database access
* Sensitive information exposure
* Payment screenshot leakage
* Student personal data exposure

### QR Attendance

* QR forgery
* Replay attacks
* Duplicate attendance creation
* Invalid subscription bypass

---

# Out of Scope

The following are generally **not** considered security vulnerabilities:

* UI or design suggestions
* Typographical errors
* Feature requests
* Performance improvements
* Documentation mistakes
* Non-security code style issues

These should be reported through normal GitHub Issues.

---

# Security Principles

OpenHostel follows these principles:

* Role-Based Access Control (RBAC)
* Server-side authorization for every protected action
* Encrypted password storage
* Verified email recovery
* Short-lived authentication sessions
* Input validation on APIs
* Least-privilege access

Security should always take priority over convenience.

---

# Responsible Disclosure

We ask researchers and contributors to:

* Give maintainers reasonable time to fix the issue
* Avoid publicly disclosing vulnerabilities before a patch is available
* Avoid accessing or modifying other users' data beyond what is necessary to demonstrate the issue
* Act in good faith while testing the application

Responsible disclosure helps protect students and institutions using OpenHostel.

---

# Security Status

OpenHostel is an actively developed open-source project. Security improvements are integrated into every major release, and contributors are encouraged to report vulnerabilities responsibly.
