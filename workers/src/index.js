/**
 * Cloudflare Worker for k61.dev URL redirects
 * Handles lookup of shortened URLs and redirects to destination
 */

// Reserved paths that should redirect to the app
const RESERVED_PATHS = ['favicon.ico', 'robots.txt', 'sitemap.xml', ''];

export default {
  async fetch(request, env, ctx) {
    // Get default URL from environment variable (required)
    const defaultUrl = env.DEFAULT_URL;
    
    if (!defaultUrl) {
      return new Response('Worker misconfigured: DEFAULT_URL environment variable is required', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    try {
      const url = new URL(request.url);
      const id = url.pathname.slice(1); // Remove leading /

      // Handle reserved paths - redirect to app
      if (RESERVED_PATHS.includes(id)) {
        return Response.redirect(defaultUrl, 302);
      }

      // Validate ID format (base62: a-z, A-Z, 0-9)
      if (!isValidId(id)) {
        return Response.redirect(defaultUrl, 302);
      }

      // Look up URL in Azure Table Storage
      const targetUrl = await lookupUrl(id, env);

      if (targetUrl) {
        // Fire-and-forget click tracking using waitUntil to ensure it completes
        ctx.waitUntil(trackClick(id, env));

        // Redirect to target URL
        return Response.redirect(targetUrl, 302);
      }

      // ID not found, redirect to app
      return Response.redirect(defaultUrl, 302);
    } catch (error) {
      console.error('Worker error:', error);
      // On error, redirect to app
      return Response.redirect(defaultUrl, 302);
    }
  },
};

/**
 * Validate that ID contains only base62 characters
 */
function isValidId(id) {
  if (!id || id.length === 0 || id.length > 10) {
    return false;
  }
  return /^[a-zA-Z0-9]+$/.test(id);
}

/**
 * Look up shortened URL in Azure Table Storage
 */
async function lookupUrl(id, env) {
  const storageAccount = env.AZURE_STORAGE_ACCOUNT;
  const storageSas = env.AZURE_STORAGE_SAS;

  if (!storageAccount || !storageSas) {
    console.error('Azure storage credentials not configured');
    return null;
  }

  // Construct partition key (first 2 chars of ID, or ID if shorter)
  const partitionKey = id.length >= 2 ? id.substring(0, 2) : id;
  const rowKey = id;

  try {
    // Query Azure Table Storage using REST API with SAS token
    const tableName = 'URLs';
    const queryUrl = `https://${storageAccount}.table.core.windows.net/${tableName}(PartitionKey='${partitionKey}',RowKey='${rowKey}')?${storageSas}`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json;odata=nometadata',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.URL; // Return the URL column
    }

    return null;
  } catch (error) {
    console.error('Error looking up URL:', error);
    return null;
  }
}

/**
 * Track click by calling Azure Function API
 */
async function trackClick(id, env) {
  const apiKey = env.INTERNAL_API_KEY;
  const apiUrl = env.AZURE_API_URL;
  if (!apiKey || !apiUrl) {
    return;
  }

  try {
    await fetch(`${apiUrl}/api/click/${id}`, {
      method: 'POST',
      headers: {
        'X-Internal-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Silently fail - don't impact redirects
  }
}
