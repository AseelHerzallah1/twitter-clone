export const HASHTAG_REGEX = /#[\p{L}\p{M}\p{N}_]+/giu;

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractHashtags = (text) => text?.match(HASHTAG_REGEX) || [];
