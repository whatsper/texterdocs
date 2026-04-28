---
sidebar_position: 1
---

# Salesforce

This page is a **support-facing note** to help troubleshoot and onboard Salesforce-related requests when the exact object / Record Type / field names are unclear.

---

## Salesforce onboarding (for Texter Support)

These steps are for connecting a customer Salesforce org to Texter via **OAuth**.

### 1) Create / configure the Connected App (Salesforce)

- Log in to Salesforce as an **Admin** (non-admin users often can’t create apps).
- Go to **Setup → Platform Apps → App Manager**.
- Create a new app (Connected App / External Client App depending on UI).

![Setup → App Manager](/img/adapters/salesforce/setup-app-manager.png)

Recommended OAuth settings (names may vary slightly by Salesforce UI/version):

- **IP Relaxation**: Relax IP restrictions
- **Refresh Token Policy**: Refresh token is valid until revoked
- **Permitted Users**: All users may self authorize
- **PKCE**: disable (uncheck/cancel PKCE)

![Connected app OAuth settings (example)](/img/adapters/salesforce/connected-app-oauth-settings.png)

**Callback / Redirect URL** (must match exactly):

```text
https://PROJECTID.texterchat.com/server/auth/oauth/v2/authorize-callback/salesforce/default
```

![Callback / Redirect URL field (example)](/img/adapters/salesforce/connected-app-callback-url.png)

### 2) Configure customer `oauthServices` (Nihul)

Add (or merge) the following under the customer config root:

```json
{
  "oauthServices": {
    "salesforce": {
      "enabled": true,
      "config": {
        "orgHost": "https://{{yourOrg}}.my.salesforce.com",
        "consumerKey": "CONSUMER_KEY",
        "consumerSecret": "CONSUMER_SECRET",
        "sandbox": false
      }
    }
  }
}
```

![Customer config (Nihul) — oauthServices.salesforce](/img/adapters/salesforce/nihul-oauthservices-salesforce.png)

### 3) Complete OAuth authorization

Have the customer authorize the app in their Salesforce UI (often via screen-share). If the authorization step fails, re-check the callback URL and OAuth settings first.

![OAuth authorization / consent screen (example)](/img/adapters/salesforce/oauth-consent-screen.png)

---

## Useful queries (for Texter Support)

:::tip[Prerequisites]
- You need a valid **Salesforce instance URL** (replace `YOUR_INSTANCE`).
- You need an **OAuth access token** (replace `YOUR_ACCESS_TOKEN`).
:::

### Find Record Types (e.g. for “Service Request”)

If a customer asks us to do something with an object like **“Service Request”** and we’re not sure how it’s modeled in their org, start by listing all Record Types:

```bash
curl --request GET \
  --url "https://YOUR_INSTANCE.salesforce.com/services/data/v62.0/query?q=SELECT+Id,Name,DeveloperName,SobjectType,IsActive+FROM+RecordType+ORDER+BY+SobjectType,Name" \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Then either:

- Scan the response and locate the relevant `SobjectType` / `Name` / `DeveloperName`, or
- Add a filter to the SOQL query (for example a `WHERE Name = '...'`) once you know what you’re looking for.

### Inspect object fields (`describe`)

If you already know the object API name and need to understand which fields exist (and their API names), use the object `describe` endpoint:

```bash
curl --request GET \
  --url "https://YOUR_INSTANCE.salesforce.com/services/data/v62.0/sobjects/Account/describe" \
  --header "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `Account` with the object you want to inspect.

:::note
If you specifically need Record Type metadata, use the `RecordType` object instead of `Account`.
:::

