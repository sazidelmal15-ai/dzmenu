# DZMenu — Security Requirements

## 1. Security Objective

Security is a core requirement of DZMenu.

DZMenu must protect:

- Restaurant accounts
- Restaurant-owned data
- Platform administration
- Support accounts
- Subscription information
- Uploaded images and media
- Analytics data
- Internal system information

The system must be designed to prevent unauthorized access, unauthorized modification, data leakage, privilege escalation, and common web application attacks.

Security must be considered throughout development and not treated as a final feature added after the product is built.

---

## 2. Security Principles

DZMenu follows these principles:

1. Never trust client-controlled data.
2. Use least privilege.
3. Verify authorization on the server.
4. Isolate every restaurant from every other restaurant.
5. Never expose secrets to the client.
6. Fail safely.
7. Do not reveal sensitive internal information in public errors.
8. Prefer secure defaults.
9. Validate input at system boundaries.
10. Keep production protected from unsafe development actions.
11. Minimize unnecessary collection of customer data.
12. Security controls must remain effective as the platform grows.

---

## 3. Authentication

Authentication is responsible for verifying user identity.

Authentication must:

- Use a trusted and secure authentication mechanism.
- Never store passwords in plaintext.
- Use secure password hashing when passwords are managed by DZMenu.
- Protect authentication sessions.
- Use secure token handling.
- Implement secure password reset flows.
- Use expiring password reset tokens.
- Prevent account enumeration where practical.
- Apply rate limiting to authentication endpoints.
- Invalidate compromised or revoked sessions where appropriate.

Sensitive administrative accounts should support multi-factor authentication.

Customers do not require authentication to view public menus.

---

## 4. Authorization

Authorization is separate from authentication.

Authentication answers:

"Who is the user?"

Authorization answers:

"What is the user allowed to do?"

Every protected operation must verify:

1. Authenticated identity
2. User role
3. Restaurant context when applicable
4. Resource ownership
5. Permission to perform the requested action

Authorization must be enforced server-side.

The client interface must never be treated as the security boundary.

Hiding a button in the frontend is not considered authorization.

---

## 5. Roles

DZMenu has the following roles:

### SUPER_OWNER (SUPER_ADMIN)

Platform owner with full administrative access across the entire platform.

### SUPPORT

Support staff with limited administrative permissions defined by the platform.

### RESTAURANT_OWNER

Owner or authorized manager of a restaurant tenant.

### PUBLIC_USER (CUSTOMER)

Public visitor with read-only access to public menu content. Customers do not require authentication.

---

## 6. Restaurant Tenant Isolation

Tenant isolation is one of the highest-priority security requirements.

Every restaurant must be isolated from every other restaurant.

Restaurant A must never be able to:

- Read Restaurant B private data
- Modify Restaurant B data
- Delete Restaurant B data
- Access Restaurant B private files
- Access Restaurant B subscription information
- Access Restaurant B analytics
- Access Restaurant B dashboard
- Access Restaurant B internal resources

Changing identifiers in client requests must never allow a user to access another restaurant.

The server must verify that a requested resource belongs to the authenticated user's authorized restaurant.

---

## 7. Object-Level Authorization

Every resource access must be checked at the object level.

For example:

If a Restaurant Owner requests:

GET /menu-items/item-123

The server must verify that:

- The user is authenticated.
- The user owns or has access to the relevant restaurant.
- item-123 belongs to that restaurant.
- The requested action is allowed.

The system must not rely only on:

- URL structure
- Client-provided restaurant IDs
- Hidden form values
- Frontend state
- User-controlled role values

---

## 8. Privilege Escalation Protection

Users must never be able to elevate their own privileges.

A Restaurant Owner must not be able to become:

- SUPPORT
- SUPER_ADMIN

A Support user must not be able to grant themselves Super Admin permissions.

Role assignment and modification must be performed only by authorized platform administration.

User roles must not be trusted directly from client input.

---

## 9. Admin Security

Administrative access must receive stronger protection because it can affect many restaurants.

Admin functionality must:

- Require authentication.
- Require appropriate authorization.
- Use secure sessions.
- Use stronger account protection.
- Restrict sensitive actions.
- Log important administrative operations.
- Avoid exposing unnecessary restaurant data.
- Protect against privilege escalation.

Highly sensitive administrative operations should require additional confirmation where appropriate.

Examples:

- Permanent restaurant deletion
- Ownership changes
- Destructive data actions
- Critical security changes

---

## 10. Support Security

Support users must have only the permissions necessary to perform support operations.

Support users should not automatically have Super Admin permissions.

Permissions should be explicitly defined.

Support access should be auditable.

Sensitive actions taken by Support should be logged where appropriate.

Support must not be able to bypass tenant isolation.

---

## 11. API Security

All protected API endpoints must implement appropriate:

- Authentication
- Authorization
- Input validation
- Rate limiting
- Safe error handling

APIs must not trust identifiers, roles, permissions, or ownership values supplied by the client.

APIs must return only data necessary for the requested operation.

Internal database records and sensitive fields must not be exposed unnecessarily.

---

## 12. Input Validation

All user-controlled input must be treated as untrusted.

This includes:

- Restaurant names
- Menu item names
- Descriptions
- Ingredients
- Prices
- URLs
- Search terms
- Template settings
- Theme values
- Uploaded files
- Query parameters
- Request bodies
- Headers where applicable

Inputs must be validated according to their expected type and purpose.

Examples:

- Prices must use valid numeric constraints.
- Text fields must have reasonable length limits.
- URLs must be validated when accepted.
- IDs must use expected formats.
- Enumerated values must be checked against allowed values.

---

## 13. XSS Protection

Restaurant content is user-controlled content.

The application must prevent stored and reflected cross-site scripting.

Potentially unsafe content includes:

- Restaurant names
- Menu item names
- Descriptions
- Ingredients
- Custom text
- Links
- Theme configuration

User-controlled content must not be rendered as executable HTML or JavaScript unless there is an explicitly designed and securely implemented mechanism.

Restaurants must not be allowed to inject arbitrary JavaScript into public menus.

---

## 14. Injection Protection

The application must defend against common injection vulnerabilities.

This includes:

- SQL injection
- Command injection
- Template injection
- Header injection
- Other context-specific injection attacks

Database queries must use safe parameterization or a trusted ORM/query system.

User input must never be concatenated into executable commands or unsafe queries.

---

## 15. CSRF Protection

State-changing authenticated operations must be protected against unauthorized cross-site requests where the chosen authentication mechanism requires CSRF protection.

Examples include:

- Updating menu items
- Changing restaurant settings
- Changing subscription state
- Administrative actions
- Account changes

The selected application architecture must explicitly document how CSRF risks are addressed.

---

## 16. Rate Limiting and Abuse Prevention

Rate limiting should be applied to sensitive or abuse-prone endpoints.

Examples include:

- Login
- Password reset
- Account creation
- Authentication verification
- Public API endpoints where necessary
- Administrative APIs
- Other expensive operations

Rate limits should be appropriate for the endpoint and may vary by:

- IP
- Account
- Session
- API key
- Restaurant
- Other appropriate identifiers

Public QR visits should not be blocked simply because a restaurant becomes popular.

High-volume public traffic must be handled separately from authentication and administrative abuse controls.

---

## 17. File Upload Security

Restaurants may upload images for:

- Restaurant logos
- Cover images
- Menu items

Uploaded files must be treated as untrusted.

The application must:

- Enforce file size limits.
- Validate file types.
- Validate file content where appropriate.
- Use safe storage locations.
- Generate safe storage names.
- Prevent executable file uploads.
- Process images safely.
- Prevent path traversal.
- Avoid serving uploaded files as executable content.

Image processing should remove or normalize unnecessary metadata when appropriate.

---

## 18. Secrets Management

Secrets must never be exposed to users or committed to source control.

This includes:

- Database credentials
- Service-role keys
- API keys
- Signing secrets
- Encryption keys
- Internal tokens
- Infrastructure credentials

Secrets must be stored using appropriate environment or secret-management mechanisms.

Privileged server-side credentials must never be shipped to client-side code.

Different environments must use separate credentials where practical.

---

## 19. Client and Server Separation

The browser must never be trusted with privileged operations.

Sensitive operations must execute server-side.

Examples:

- Administrative actions
- Subscription modification
- User role changes
- Restaurant ownership changes
- Privileged database operations

Client-side checks may improve user experience but are never sufficient as security controls.

---

## 20. Database Security

The database must enforce appropriate access restrictions.

Security should use multiple defensive layers where practical:

- Application authorization
- Database constraints
- Tenant-aware queries
- Row-level security where appropriate
- Least-privilege database access

Restaurant ownership relationships must be validated.

Foreign keys and constraints should prevent invalid ownership relationships where appropriate.

Sensitive database fields should not be returned to clients unless required.

---

## 21. Row-Level Security

If Row-Level Security is used, policies must be designed and tested carefully.

RLS must never be treated as a substitute for application authorization.

RLS policies must ensure that users can only access records within their authorized scope.

Policies must be tested for:

- Read access
- Insert access
- Update access
- Delete access
- Cross-restaurant access
- Role boundaries

---

## 22. Subscription Security

Subscription state must be protected from client manipulation.

Restaurant users must not be able to:

- Extend their own subscription
- Change their subscription status
- Modify expiration dates
- Upgrade themselves without authorization
- Bypass subscription restrictions

Subscription state must be determined server-side.

The client must not be treated as the source of truth for subscription status.

Expired subscriptions must not cause accidental deletion of restaurant data.

---

## 23. QR Security

QR codes are public access points and must not expose private information.

A QR code must not contain:

- Private credentials
- Authentication tokens
- Internal database credentials
- Sensitive restaurant data

Public QR identifiers should not reveal unnecessary internal database information.

Changing an existing restaurant's menu or theme must not invalidate its QR unless explicitly intended.

QR access must never provide authenticated administrative privileges.

---

## 24. Analytics and Privacy

DZMenu should collect the minimum data required to provide useful analytics.

Analytics should prioritize aggregated or non-sensitive information.

Do not collect personally identifiable information unless there is a clear product and legal requirement.

Analytics systems must respect restaurant data isolation.

Public analytics must not expose private information about other restaurants.

---

## 25. Logging

Security-relevant events should be logged appropriately.

Examples include:

- Failed authentication attempts
- Suspicious authentication activity
- Administrative actions
- Role changes
- Subscription changes
- Sensitive account changes
- Security configuration changes
- Important data access events where appropriate

Logs must not contain unnecessary secrets or sensitive information.

Logging must not become a source of data leakage.

---

## 26. Auditability

Important administrative actions should be traceable.

Where appropriate, audit records should include:

- Who performed the action
- What action was performed
- What resource was affected
- When it occurred
- Relevant result or status

Audit data must itself be protected from unauthorized modification.

---

## 27. Error Handling

Public errors must not reveal sensitive internal details.

Do not expose:

- Database errors
- Stack traces
- Secrets
- Internal file paths
- SQL statements
- Infrastructure details
- Other sensitive diagnostic information

Users should receive safe and useful messages.

Detailed diagnostics should remain server-side.

---

## 28. Sessions and Cookies

Authentication sessions must be configured securely according to the selected authentication system.

Where applicable, use:

- Secure cookies
- HttpOnly cookies
- Appropriate SameSite settings
- Session expiration
- Session rotation where appropriate
- Session revocation for sensitive security events

Session identifiers must never be exposed unnecessarily.

---

## 29. Password Reset

Password reset flows must:

- Use cryptographically secure tokens.
- Use short expiration periods.
- Be single-use.
- Avoid exposing whether an account exists where practical.
- Invalidate previously used reset tokens.
- Avoid logging reset tokens.

Password reset links must not grant broader permissions than intended.

---

## 30. Account Recovery

Account recovery must be designed so that attackers cannot use recovery mechanisms to bypass normal authentication.

Sensitive account recovery actions may require additional verification.

Ownership changes must never rely only on easily guessable information.

---

## 31. Dependency Security

Third-party dependencies must be minimized and reviewed.

The project should:

- Avoid unnecessary packages.
- Keep dependencies updated.
- Monitor known vulnerabilities.
- Remove unused dependencies.
- Review security-sensitive libraries carefully.

Adding a dependency should have a clear justification.

---

## 32. Supply Chain Security

The project should protect against compromised dependencies and development tooling.

Where practical:

- Lock dependency versions.
- Review dependency changes.
- Avoid unknown packages.
- Keep lockfiles committed.
- Audit dependencies regularly.

AI-generated dependencies must receive the same scrutiny as manually selected dependencies.

---

## 33. Production Safety

Production must be isolated from normal development activity.

Developers and AI tools must not directly modify production data as part of routine development.

Production changes must use a controlled deployment process.

Database changes must be performed through reviewed migrations.

---

## 34. Database Migration Safety

Every schema change must use a versioned migration.

Before applying a high-risk migration:

1. Review the change.
2. Test in development.
3. Test in staging.
4. Verify compatibility with existing data.
5. Confirm a recent backup exists.
6. Review potential downtime or behavior changes.
7. Deploy using a controlled process.

Destructive migrations require additional review.

---

## 35. Backup and Recovery

Production data must have backups appropriate to the importance of the service.

Backups should be protected from unauthorized access.

The platform should maintain a recovery procedure.

As DZMenu grows, backup retention and recovery targets should be formally defined.

A backup strategy is incomplete unless restoration can also be tested.

---

## 36. Environment Separation

The following environments should remain separate:

Development
Staging
Production

They should use separate configuration and credentials.

Development credentials must not provide unnecessary access to production.

Production secrets must never be stored in development source code.

---

## 37. Security Headers and Browser Protections

The production application should use appropriate browser security controls.

Depending on the architecture, this may include:

- Content Security Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Frame protection
- Appropriate CORS policy

Security headers must be configured carefully so they do not unnecessarily break legitimate functionality.

---

## 38. HTTPS and Transport Security

All authenticated and production traffic must use HTTPS.

Sensitive information must not be transmitted over insecure connections.

HTTP requests should redirect or otherwise be handled securely according to the hosting architecture.

---

## 39. CORS

Cross-origin requests must be restricted to explicitly trusted origins where possible.

Do not use broad wildcard CORS policies for authenticated APIs unless there is a documented reason.

Credentials must not be exposed to untrusted origins.

---

## 40. Public Menu Security

Public menus are intentionally accessible without authentication.

Therefore:

- They must expose only public restaurant information.
- They must not expose private restaurant settings.
- They must not expose subscription details.
- They must not expose private analytics.
- They must not expose internal database identifiers unnecessarily.
- They must not expose admin functionality.

Public access must remain strictly read-oriented.

---

## 41. Theme Security

Restaurant customization must not provide unrestricted code execution.

Themes and customization systems must prevent:

- Arbitrary JavaScript
- Unsafe HTML injection
- Server-side code execution
- Access to other restaurants
- Access to private application resources

Theme configuration should use controlled schemas and validated values.

---

## 42. Custom Domain Security

If custom domains are implemented in the future:

- Domain ownership must be verified.
- A domain must not be attachable to multiple restaurants simultaneously.
- Domain verification must resist domain takeover.
- SSL certificates must be managed securely.
- Removing a domain must invalidate its platform association.
- QR identities must remain independent from custom domains.

Custom domains should not be enabled until a secure implementation is available.

---

## 43. AI Safety and Security

AI tools used during development must follow the rules defined in AI-RULES.md.

AI must not:

- Disable security controls to make development easier.
- Bypass authorization.
- Expose secrets.
- Modify production data.
- Delete production records.
- Remove tenant isolation.
- Introduce insecure shortcuts without explicit approval.

Generated code must be reviewed and tested like human-written code.

---

## 44. Security Testing Strategy

Security testing should occur throughout development.

Testing should include:

### Authentication Testing

- Login protection
- Password reset
- Session handling
- Account recovery

### Authorization Testing

- Role boundaries
- Object-level authorization
- Tenant isolation
- Privilege escalation

### API Testing

- Unauthorized requests
- Malformed inputs
- Rate limiting
- Access control bypass

### Input Testing

- XSS
- Injection
- Invalid data
- Oversized values

### File Testing

- Invalid file types
- Oversized files
- Malicious files
- Path traversal attempts

### QR Testing

- Invalid QR identifiers
- Manipulated identifiers
- Public/private boundary testing
- QR stability after changes

### Subscription Testing

- Expiration
- Renewal
- Client-side manipulation attempts
- Unauthorized subscription changes

---

## 45. Security Review Process

Before major production releases:

1. Review the changed components.
2. Identify new attack surfaces.
3. Run automated security checks.
4. Run authorization and tenant-isolation tests.
5. Test critical user flows manually.
6. Review dependency vulnerabilities.
7. Verify production configuration.
8. Fix findings.
9. Retest after fixes.

For major platform growth, a professional external security review or penetration test should be considered.

---

## 46. Vulnerability Handling

When a vulnerability is discovered:

1. Identify and reproduce the issue.
2. Determine affected systems and data.
3. Assign severity.
4. Fix the vulnerability.
5. Add a regression test where appropriate.
6. Verify the fix.
7. Review similar code for the same weakness.
8. Document the outcome.

A security issue should not be considered closed until the fix has been retested.

---

## 47. Security Priority

Security priorities are:

### Critical

- Authentication bypass
- Authorization bypass
- Cross-restaurant data access
- Super Admin compromise
- Remote code execution
- Secret exposure
- Production database compromise

### High

- Privilege escalation
- Stored XSS
- Significant API abuse
- Sensitive data exposure
- Serious file upload vulnerabilities

### Medium

- Limited information disclosure
- Misconfiguration
- Moderate abuse issues

### Low

- Minor hardening opportunities
- Low-impact information exposure

Severity may be adjusted according to actual risk and impact.

---

## 48. Security Change Rule

No feature should be considered complete if it introduces a known security vulnerability.

Security requirements must be reviewed whenever a feature changes:

- Authentication
- Authorization
- Database access
- File uploads
- Public URLs
- QR handling
- Themes
- Custom domains
- Subscriptions
- Analytics
- Administration

---

## 49. Security Principle for Existing Restaurants

Existing restaurant data is production-critical.

Any security improvement or architectural change must preserve:

- Restaurant data
- Menu data
- QR codes
- Public URLs
- Subscription records
- Ownership relationships

Security fixes must not silently destroy or corrupt existing restaurant data.

---

## 50. Final Security Rules

The following are mandatory:

1. Every protected action must be authorized server-side.
2. Every restaurant must be isolated from every other restaurant.
3. Client-controlled identifiers must never determine authorization.
4. Secrets must never be exposed to clients.
5. Production data must never be casually modified.
6. Database schema changes must use migrations.
7. QR identities must remain stable.
8. Subscription state must be server-controlled.
9. Uploaded files must be treated as untrusted.
10. Public menus must expose only public information.
11. Themes must not allow arbitrary code execution.
12. Security testing must be repeated after significant changes.
13. AI-generated code must follow the same security standards as human-written code.
14. Security is a continuous process, not a one-time task.