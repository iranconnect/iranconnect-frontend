// frontend/utils/apiClientAdmin.js

import apiClient from "./apiClient";

/*
 * Admin requests use the central API client.
 *
 * apiClient automatically adds:
 *   x-iranconnect-admin: 1
 *
 * when the request URL contains "/admin".
 *
 * Keeping this compatibility alias means existing imports do not
 * need to be changed throughout the Admin frontend.
 */
const apiClientAdmin = apiClient;

export default apiClientAdmin;
