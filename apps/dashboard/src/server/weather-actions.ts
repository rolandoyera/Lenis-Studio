"use server";

/**
 * Server Action: Fetches the current weather for the provided ZIP code or location query.
 * Securely encapsulates the WEATHER_API_KEY on the server.
 */
export async function getWeatherForLocation(locationQuery?: string) {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.warn(
        "[Weather API] WEATHER_API_KEY is not defined in .env.local",
      );
      return {
        success: false,
        error: "WEATHER_API_KEY is missing from environment variables.",
      };
    }

    // Default fallback to New York ZIP code if user location is not set yet
    const query =
      locationQuery && locationQuery.trim() !== ""
        ? locationQuery.trim()
        : "10001";

    console.log(
      `[Weather API] Fetching weather from weatherapi.com for query: ${query}`,
    );
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${query}&aqi=no`,
      {
        cache: "no-store", // Disable caching to guarantee real-time day/night updates
      },
    );

    if (!res.ok) {
      console.error(`[Weather API] API responded with status ${res.status}`);
      return {
        success: false,
        error: `Weather service responded with status: ${res.status}`,
      };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error("[Weather API] Unexpected server fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
