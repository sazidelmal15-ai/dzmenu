/**
 * Social Media URL Parser & Validator Utility.
 * Supports TikTok, Instagram, Facebook, and WhatsApp.
 * Extracts clean usernames and validates domain matching.
 */

export type SocialPlatform = "tiktok" | "instagram" | "facebook" | "whatsapp" | "maps";

export interface ParsedSocialLink {
  isValidPlatform: boolean;
  platform: SocialPlatform;
  rawInput: string;
  extractedUsername: string | null;
  canonicalUrl: string | null;
  errorMessage?: string;
}

/**
 * Parses and validates an input string or URL for a specific social platform.
 */
export function parseSocialLink(input: string, platform: SocialPlatform): ParsedSocialLink {
  const trimmed = (input || "").trim();

  if (!trimmed) {
    return {
      isValidPlatform: true,
      platform,
      rawInput: "",
      extractedUsername: null,
      canonicalUrl: null,
    };
  }

  // Remove trailing slashes and query parameters for parsing
  let cleanStr = trimmed.replace(/\?.*$/, "").replace(/\/+$/, "");

  // -------------------------------------------------------------------------
  // 1. GOOGLE MAPS PARSER
  // -------------------------------------------------------------------------
  if (platform === "maps") {
    // Check if user pasted a link from social media or other unrelated platform
    if (/^(https?:\/\/)?(www\.)?(tiktok\.com|instagram\.com|facebook\.com|fb\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com)/i.test(trimmed)) {
      return {
        isValidPlatform: false,
        platform,
        rawInput: trimmed,
        extractedUsername: null,
        canonicalUrl: null,
        errorMessage: "رابط غير صالح",
      };
    }

    // Must match Google Maps patterns
    const isGoogleMaps = /^(https?:\/\/)?((www\.)?google\.[a-z]+(\.[a-z]+)?\/(maps|search|place|\?q=|\?cid=).*|maps\.google\.[a-z]+(\.[a-z]+)?(\/|\?.*)?|maps\.app\.goo\.gl\/[a-zA-Z0-9_-]+|goo\.gl\/maps\/[a-zA-Z0-9_-]+)/i.test(trimmed);
    if (isGoogleMaps) {
      const canonical = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: "Google Maps",
        canonicalUrl: canonical,
      };
    }

    return {
      isValidPlatform: false,
      platform,
      rawInput: trimmed,
      extractedUsername: null,
      canonicalUrl: null,
      errorMessage: "رابط غير صالح",
    };
  }

  // -------------------------------------------------------------------------
  // 1. TIKTOK PARSER
  // -------------------------------------------------------------------------
  if (platform === "tiktok") {
    // Check if user pasted a link from another known platform
    if (/^(https?:\/\/)?(www\.)?(instagram\.com|facebook\.com|fb\.com|youtube\.com|youtu\.be|x\.com|twitter\.com|linkedin\.com)/i.test(cleanStr)) {
      return {
        isValidPlatform: false,
        platform,
        rawInput: trimmed,
        extractedUsername: null,
        canonicalUrl: null,
        errorMessage: "رابط غير صالح",
      };
    }

    // Match full URL: https://www.tiktok.com/@username or tiktok.com/@username
    const urlMatch = cleanStr.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?tiktok\.com\/@?([a-zA-Z0-9_.-]+)/i);
    if (urlMatch && urlMatch[1]) {
      const handle = urlMatch[1].replace(/^@/, "");
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: `@${handle}`,
        canonicalUrl: `https://www.tiktok.com/@${handle}`,
      };
    }

    // Match handle only: @username or username
    const handleMatch = cleanStr.match(/^@?([a-zA-Z0-9_.-]{2,30})$/);
    if (handleMatch && handleMatch[1] && !cleanStr.includes(".")) {
      const handle = handleMatch[1].replace(/^@/, "");
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: `@${handle}`,
        canonicalUrl: `https://www.tiktok.com/@${handle}`,
      };
    }

    return {
      isValidPlatform: false,
      platform,
      rawInput: trimmed,
      extractedUsername: null,
      canonicalUrl: null,
      errorMessage: "رابط غير صالح",
    };
  }

  // -------------------------------------------------------------------------
  // 2. INSTAGRAM PARSER
  // -------------------------------------------------------------------------
  if (platform === "instagram") {
    if (/^(https?:\/\/)?(www\.)?(tiktok\.com|facebook\.com|fb\.com|youtube\.com|x\.com|twitter\.com)/i.test(cleanStr)) {
      return {
        isValidPlatform: false,
        platform,
        rawInput: trimmed,
        extractedUsername: null,
        canonicalUrl: null,
        errorMessage: "رابط غير صالح",
      };
    }

    const urlMatch = cleanStr.match(/(?:https?:\/\/)?(?:www\.)?(?:instagr\.am|instagram\.com)\/([a-zA-Z0-9_.]+)/i);
    if (urlMatch && urlMatch[1] && !["p", "reel", "stories", "explore"].includes(urlMatch[1].toLowerCase())) {
      const handle = urlMatch[1].replace(/^@/, "");
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: `@${handle}`,
        canonicalUrl: `https://www.instagram.com/${handle}`,
      };
    }

    const handleMatch = cleanStr.match(/^@?([a-zA-Z0-9_.]{1,30})$/);
    if (handleMatch && handleMatch[1]) {
      const handle = handleMatch[1].replace(/^@/, "");
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: `@${handle}`,
        canonicalUrl: `https://www.instagram.com/${handle}`,
      };
    }

    return {
      isValidPlatform: false,
      platform,
      rawInput: trimmed,
      extractedUsername: null,
      canonicalUrl: null,
      errorMessage: "رابط غير صالح",
    };
  }

  // -------------------------------------------------------------------------
  // 3. FACEBOOK PARSER
  // -------------------------------------------------------------------------
  if (platform === "facebook") {
    if (/^(https?:\/\/)?(www\.)?(tiktok\.com|instagram\.com|youtube\.com|x\.com|twitter\.com)/i.test(cleanStr)) {
      return {
        isValidPlatform: false,
        platform,
        rawInput: trimmed,
        extractedUsername: null,
        canonicalUrl: null,
        errorMessage: "رابط غير صالح",
      };
    }

    const urlMatch = cleanStr.match(/(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([a-zA-Z0-9_.-]+)/i);
    if (urlMatch && urlMatch[1]) {
      const handle = urlMatch[1];
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: handle,
        canonicalUrl: `https://www.facebook.com/${handle}`,
      };
    }

    const handleMatch = cleanStr.match(/^@?([a-zA-Z0-9_.-]{3,50})$/);
    if (handleMatch && handleMatch[1]) {
      return {
        isValidPlatform: true,
        platform,
        rawInput: trimmed,
        extractedUsername: handleMatch[1],
        canonicalUrl: `https://www.facebook.com/${handleMatch[1]}`,
      };
    }

    return {
      isValidPlatform: false,
      platform,
      rawInput: trimmed,
      extractedUsername: null,
      canonicalUrl: null,
      errorMessage: "رابط غير صالح",
    };
  }

  return {
    isValidPlatform: true,
    platform,
    rawInput: trimmed,
    extractedUsername: trimmed,
    canonicalUrl: trimmed,
  };
}
