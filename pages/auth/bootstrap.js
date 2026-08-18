import {
  useEffect,
  useMemo,
  useState,
} from "react";

import apiClient from "../../utils/apiClient";
import { Eye, EyeOff } from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ConsentReviewModal from "../../components/ConsentReviewModal";

import BootstrapProgress from "../../components/bootstrap/BootstrapProgress";
import BootstrapPolicyEditor from "../../components/bootstrap/BootstrapPolicyEditor";

const POLICY_TYPES = [
  "terms",
  "privacy",
  "cookies",
];

const POLICY_LANGUAGES = [
  "en",
  "fr",
  "fa",
];

const TYPE_LABELS = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  cookies: "Cookie Policy",
};

const LANGUAGE_LABELS = {
  en: "EN",
  fr: "FR",
  fa: "FA",
};

function createEmptyDrafts() {
  const drafts = {};

  for (const type of POLICY_TYPES) {
    for (
      const lang of POLICY_LANGUAGES
    ) {
      drafts[`${type}:${lang}`] = {
        content: "",
        changeNote: `Initial ${TYPE_LABELS[type]} (${lang.toUpperCase()})`,
      };
    }
  }

  return drafts;
}

function isCapabilityError(error) {
  const status =
    error?.response?.status;

  return (
    status === 401 ||
    status === 403
  );
}

export default function BootstrapSetup() {
  const [rawToken, setRawToken] =
    useState("");

  const [capability, setCapability] =
    useState("");

  const [ownerEmail, setOwnerEmail] =
    useState("");

  const [claimPassword, setClaimPassword] =
    useState("");

  const [
    claimPasswordConfirm,
    setClaimPasswordConfirm,
  ] = useState("");

  const [
    showClaimPassword,
    setShowClaimPassword,
  ] = useState(false);

  const [
    showClaimPasswordConfirm,
    setShowClaimPasswordConfirm,
  ] = useState(false);

  const [
    showResumePassword,
    setShowResumePassword,
  ] = useState(false);

  const [resumeEmail, setResumeEmail] =
    useState("");

  const [resumePassword, setResumePassword] =
    useState("");

  const [mode, setMode] =
    useState("boot");

  const [status, setStatus] =
    useState(null);

  const [selectedType, setSelectedType] =
    useState("terms");

  const [selectedLang, setSelectedLang] =
    useState("en");

  const [drafts, setDrafts] =
    useState(createEmptyDrafts);

  const [busy, setBusy] =
    useState(false);

  const [publishingKey, setPublishingKey] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    showConsentReview,
    setShowConsentReview,
  ] = useState(false);

  const [language, setLanguage] =
    useState("en");

  const selectedKey =
    `${selectedType}:${selectedLang}`;

  const selectedDraft =
    drafts[selectedKey] || {
      content: "",
      changeNote: "",
    };

  const selectedPublished =
    status?.policies
      ?.[selectedType]
      ?.[selectedLang]
      ?.published === true;

  const allPublished =
    status
      ?.all_required_policies_published ===
    true;

  const publishedCount =
    Number(
      status?.published_count || 0
    );

  const activeProgressStep =
    mode === "review" ||
    mode === "completing" ||
    mode === "completed"
      ? "review"
      : capability
      ? "legal"
      : "account";

  useEffect(() => {
    const htmlLanguage =
      document.documentElement.getAttribute(
        "lang"
      ) || "en";

    setLanguage(
      ["en", "fr", "fa"].includes(
        htmlLanguage
      )
        ? htmlLanguage
        : "en"
    );

    const hash =
      window.location.hash || "";

    const params =
      new URLSearchParams(
        hash.replace(/^#/, "")
      );

    const token =
      String(
        params.get("token") || ""
      ).trim();

    if (token) {
      setRawToken(token);
      setMode("claim");

      /*
       * Remove the secret from the visible URL
       * immediately after reading it.
       *
       * The token remains only in React memory.
       */
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`
      );

      return;
    }

    setMode("resume");
  }, []);

  function clearSecrets() {
    setRawToken("");
    setCapability("");
    setClaimPassword("");
    setClaimPasswordConfirm("");
    setResumePassword("");
  }

  function requireResume(
    fallbackMessage =
      "Your secure Bootstrap session expired. Please resume setup."
  ) {
    setCapability("");
    setClaimPassword("");
    setClaimPasswordConfirm("");
    setResumePassword("");

    if (ownerEmail) {
      setResumeEmail(ownerEmail);
    }

    setMode("resume");
    setError(fallbackMessage);
    setMessage("");
  }

  async function loadStatus(
    capabilityToken
  ) {
    const response =
      await apiClient.get(
        "/bootstrap/legal/status",
        {
          headers: {
            Authorization:
              `Bearer ${capabilityToken}`,
          },

          skipAuthRedirect: true,
        }
      );

    const nextStatus =
      response.data;

    setStatus(nextStatus);

    if (
      nextStatus?.user?.email
    ) {
      setOwnerEmail(
        nextStatus.user.email
      );

      setResumeEmail(
        nextStatus.user.email
      );
    }

    setMode("legal");

    return nextStatus;
  }

  async function handleClaim(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!rawToken) {
      setError(
        "Bootstrap claim token is missing. Use the secure link from the Bootstrap email."
      );
      return;
    }

    if (
      claimPassword.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      claimPassword !==
      claimPasswordConfirm
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setBusy(true);

      const response =
        await apiClient.post(
          "/bootstrap/claim",
          {
            token:
              rawToken,

            password:
              claimPassword,
          },
          {
            skipAuthRedirect: true,
          }
        );

      /*
       * A successful HTTP claim means the one-time raw token
       * has been consumed by the backend. Discard it before
       * doing any follow-up work, even if capability/status
       * handling fails afterward.
       */
      setRawToken("");

      const email =
        response.data
          ?.user
          ?.email || "";

      setOwnerEmail(email);
      setResumeEmail(email);

      /*
       * Do not retain the chosen password after
       * the claim transaction succeeds.
       */
      setClaimPassword("");
      setClaimPasswordConfirm("");

      const capabilityToken =
        response.data
          ?.capability_token;

      if (!capabilityToken) {
        setCapability("");
        setMode("resume");

        throw new Error(
          "The SuperAdmin account was claimed, but the secure setup capability was not returned. Resume setup with the new credentials."
        );
      }

      setCapability(
        capabilityToken
      );

      try {
        await loadStatus(
          capabilityToken
        );
      } catch (statusError) {
        /*
         * Claim is already committed and cannot be retried
         * with the consumed raw token. Move to the supported
         * credential-based resume path instead.
         */
        setCapability("");
        setMode("resume");

        throw new Error(
          "The SuperAdmin account was claimed, but setup progress could not be loaded. Resume setup with the new credentials.",
          {
            cause: statusError,
          }
        );
      }

      setMessage(
        "SuperAdmin account claimed successfully. Continue with the required legal policies."
      );
    } catch (requestError) {
      console.error(
        "Bootstrap claim failed:",
        requestError
      );

      setError(
        requestError
          ?.response
          ?.data
          ?.error ||
          requestError?.message ||
          "Bootstrap claim could not be completed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResume(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !resumeEmail.trim() ||
      !resumePassword
    ) {
      setError(
        "Email and password are required."
      );
      return;
    }

    try {
      setBusy(true);

      const response =
        await apiClient.post(
          "/bootstrap/legal/resume",
          {
            email:
              resumeEmail.trim(),

            password:
              resumePassword,
          },
          {
            skipAuthRedirect: true,
          }
        );

      const capabilityToken =
        response.data
          ?.capability_token;

      if (!capabilityToken) {
        throw new Error(
          "Bootstrap capability missing from resume response."
        );
      }

      setCapability(
        capabilityToken
      );

      setOwnerEmail(
        response.data
          ?.user
          ?.email ||
          resumeEmail.trim()
      );

      /*
       * Password is no longer required once a fresh
       * capability has been issued.
       */
      setResumePassword("");

      await loadStatus(
        capabilityToken
      );

      setMessage(
        "Bootstrap setup resumed securely."
      );
    } catch (requestError) {
      console.error(
        "Bootstrap resume failed:",
        requestError
      );

      setCapability("");

      setError(
        requestError
          ?.response
          ?.data
          ?.error ||
          "Bootstrap setup could not be resumed."
      );
    } finally {
      setBusy(false);
    }
  }

  function updateDraft(
    field,
    value
  ) {
    setDrafts((current) => ({
      ...current,

      [selectedKey]: {
        ...current[selectedKey],
        [field]: value,
      },
    }));
  }

  async function publishSelectedPolicy() {
    if (!capability) {
      requireResume();
      return;
    }

    const content =
      String(
        selectedDraft.content || ""
      ).trim();

    const changeNote =
      String(
        selectedDraft.changeNote || ""
      ).trim();

    if (content.length < 10) {
      setError(
        "Policy content must contain at least 10 characters."
      );
      return;
    }

    if (
      content.length > 500000
    ) {
      setError(
        "Policy content exceeds the 500,000 character limit."
      );
      return;
    }

    if (!changeNote) {
      setError(
        "A change note is required."
      );
      return;
    }

    if (
      changeNote.length > 1000
    ) {
      setError(
        "Change note exceeds the 1,000 character limit."
      );
      return;
    }

    try {
      setPublishingKey(
        selectedKey
      );

      setError("");
      setMessage("");

      await apiClient.post(
        "/bootstrap/legal/policies",
        {
          type:
            selectedType,

          lang:
            selectedLang,

          content,

          change_note:
            changeNote,
        },
        {
          headers: {
            Authorization:
              `Bearer ${capability}`,
          },

          skipAuthRedirect: true,
        }
      );

      const nextStatus =
        await loadStatus(
          capability
        );

      setMessage(
        `${TYPE_LABELS[selectedType]} (${selectedLang.toUpperCase()}) published successfully.`
      );

      if (
        nextStatus
          ?.all_required_policies_published
      ) {
        setMode("legal");
      }
    } catch (requestError) {
      console.error(
        "Bootstrap policy publication failed:",
        requestError
      );

      if (
        isCapabilityError(
          requestError
        )
      ) {
        requireResume();
        return;
      }

      const code =
        requestError
          ?.response
          ?.data
          ?.code;

      if (
        code ===
        "POLICY_FAMILY_ALREADY_EXISTS"
      ) {
        try {
          await loadStatus(
            capability
          );

          setMessage(
            "This policy was already published. Progress has been refreshed."
          );

          return;
        } catch {}
      }

      setError(
        requestError
          ?.response
          ?.data
          ?.error ||
          "Policy could not be published."
      );
    } finally {
      setPublishingKey("");
    }
  }

  async function completeBootstrap(
    presentation
  ) {
    if (!capability) {
      setShowConsentReview(false);
      requireResume();
      return;
    }

    try {
      setMode("completing");

      setError("");
      setMessage("");

      await apiClient.post(
        "/bootstrap/legal/complete",
        {
          consent_presentation_token:
            presentation.presentationToken,
        },
        {
          headers: {
            Authorization:
              `Bearer ${capability}`,
          },

          withCredentials: true,
          skipAuthRedirect: true,
        }
      );

      setShowConsentReview(false);

      /*
       * Capability becomes unusable after completion
       * and is explicitly cleared from memory.
       */
      clearSecrets();

      setMode("completed");

      window.location.replace(
        "/admin"
      );
    } catch (requestError) {
      console.error(
        "Bootstrap completion failed:",
        requestError
      );

      const statusCode =
        requestError
          ?.response
          ?.status;

      const code =
        requestError
          ?.response
          ?.data
          ?.code;

      const completed =
        requestError
          ?.response
          ?.data
          ?.completed === true;

      /*
       * The legal transaction may already be permanently
       * completed even if normal session issuance failed
       * afterward. Bootstrap must not be resumed or repeated.
       *
       * Normal login is the recovery path in this state.
       */
      if (
        completed &&
        code ===
          "BOOTSTRAP_COMPLETED_SESSION_FAILED"
      ) {
        setShowConsentReview(false);

        clearSecrets();

        setMode("completed");

        window.location.replace(
          "/auth/login"
        );

        return;
      }

      if (
        statusCode === 409 &&
        code ===
          "POLICY_PRESENTATION_STALE"
      ) {
        setMode("legal");

        setShowConsentReview(false);

        setError(
          "The policies changed while you were reviewing them. Please review the current versions again."
        );

        return;
      }

      if (
        statusCode === 400 &&
        code ===
          "INVALID_CONSENT_PRESENTATION"
      ) {
        setMode("legal");

        setShowConsentReview(false);

        setError(
          "Your policy review expired. Please review the policies again."
        );

        return;
      }

      if (
        isCapabilityError(
          requestError
        )
      ) {
        setShowConsentReview(false);
        requireResume();
        return;
      }

      setMode("legal");

      setError(
        requestError
          ?.response
          ?.data
          ?.error ||
          "Bootstrap activation could not be completed."
      );
    }
  }

  const familySummary =
    useMemo(() => {
      const result = {};

      for (
        const type of POLICY_TYPES
      ) {
        result[type] =
          POLICY_LANGUAGES.filter(
            (lang) =>
              status
                ?.policies
                ?.[type]
                ?.[lang]
                ?.published === true
          ).length;
      }

      return result;
    }, [status]);

  return (
    <div
      className="
        flex
        min-h-screen
        flex-col
      "
      style={{
        background: "#ffffff",
      }}
    >
      <Header />

      <main
        className="flex-1 px-4 py-8 md:py-10"
        style={{
          background: "#ffffff",
          color: "#0A1D37",
          "--bg": "#ffffff",
          "--card-bg": "#ffffff",
          "--text": "#0A1D37",
          "--border": "#d9e2ec",
          "--shadow-dark": "rgba(10, 29, 55, 0.12)",
          "--shadow-light": "rgba(255, 255, 255, 0.95)",
        }}
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-turquoise">
              Secure one-time setup
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              First SuperAdmin Setup
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 opacity-70 md:text-base">
              Claim the first IranConnect
              SuperAdmin account, publish the
              required legal policies, and activate
              the administrative session.
            </p>
          </div>

          <BootstrapProgress
            activeStep={
              activeProgressStep
            }
          />

          {(message || error) && (
            <div
              className="
                mt-6
                rounded-xl
                border
                p-4
                text-sm
              "
              style={{
                borderColor:
                  error
                    ? "#f59e0b"
                    : "var(--turquoise)",

                background:
                  "var(--card-bg)",
              }}
            >
              {error || message}
            </div>
          )}

          {(mode === "boot" ||
            mode === "claim") && (
            <section
              className="
                mx-auto
                mt-8
                w-full
                max-w-xl
                rounded-2xl
                border
                p-6
                md:p-8
              "
              style={{
                borderColor:
                  "var(--border)",

                background:
                  "var(--card-bg)",

                boxShadow:
                  "6px 6px 16px var(--shadow-dark), -6px -6px 16px var(--shadow-light)",
              }}
            >
              <h2 className="text-xl font-semibold">
                Claim SuperAdmin account
              </h2>

              <p className="mt-2 text-sm leading-6 opacity-70">
                Choose the password for the first
                SuperAdmin account. The secure claim
                token is kept only in memory and will
                be discarded after this step.
              </p>

              <form
                onSubmit={handleClaim}
                className="mt-6 space-y-4"
              >
                <div className="relative">
                  <input
                    type={
                      showClaimPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="new-password"
                    placeholder="New password"
                    value={claimPassword}
                    onChange={(event) =>
                      setClaimPassword(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      p-3
                      pr-11
                      focus:outline-none
                      focus:ring-2
                      focus:ring-turquoise
                    "
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--bg)",
                      color:
                        "var(--text)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowClaimPassword(
                        (current) => !current
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-turquoise
                    "
                    aria-label={
                      showClaimPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showClaimPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={
                      showClaimPasswordConfirm
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={
                      claimPasswordConfirm
                    }
                    onChange={(event) =>
                      setClaimPasswordConfirm(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      p-3
                      pr-11
                      focus:outline-none
                      focus:ring-2
                      focus:ring-turquoise
                    "
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--bg)",
                      color:
                        "var(--text)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowClaimPasswordConfirm(
                        (current) => !current
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-turquoise
                    "
                    aria-label={
                      showClaimPasswordConfirm
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showClaimPasswordConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={
                    busy ||
                    !rawToken
                  }
                  className="
                    w-full
                    rounded-lg
                    bg-turquoise
                    py-3
                    font-semibold
                    text-navy
                    shadow-md
                    transition
                    hover:bg-turquoise/90
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {busy
                    ? "Claiming..."
                    : "Claim SuperAdmin account"}
                </button>
              </form>
            </section>
          )}

          {mode === "resume" && (
            <section
              className="
                mx-auto
                mt-8
                w-full
                max-w-xl
                rounded-2xl
                border
                p-6
                md:p-8
              "
              style={{
                borderColor:
                  "var(--border)",

                background:
                  "var(--card-bg)",

                boxShadow:
                  "6px 6px 16px var(--shadow-dark), -6px -6px 16px var(--shadow-light)",
              }}
            >
              <h2 className="text-xl font-semibold">
                Resume secure setup
              </h2>

              <p className="mt-2 text-sm leading-6 opacity-70">
                Bootstrap capabilities are never
                stored in the browser. Sign in with
                the first SuperAdmin credentials to
                issue a fresh short-lived capability
                and continue where you stopped.
              </p>

              <form
                onSubmit={handleResume}
                className="mt-6 space-y-4"
              >
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="SuperAdmin email"
                  value={resumeEmail}
                  onChange={(event) =>
                    setResumeEmail(
                      event.target.value
                    )
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    p-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-turquoise
                  "
                  style={{
                    borderColor:
                      "var(--border)",
                    background:
                      "var(--bg)",
                    color:
                      "var(--text)",
                  }}
                />

                <div className="relative">
                  <input
                    type={
                      showResumePassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Password"
                    value={resumePassword}
                    onChange={(event) =>
                      setResumePassword(
                        event.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border
                      p-3
                      pr-11
                      focus:outline-none
                      focus:ring-2
                      focus:ring-turquoise
                    "
                    style={{
                      borderColor:
                        "var(--border)",
                      background:
                        "var(--bg)",
                      color:
                        "var(--text)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowResumePassword(
                        (current) => !current
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-turquoise
                    "
                    aria-label={
                      showResumePassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showResumePassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="
                    w-full
                    rounded-lg
                    bg-turquoise
                    py-3
                    font-semibold
                    text-navy
                    shadow-md
                    transition
                    hover:bg-turquoise/90
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {busy
                    ? "Resuming..."
                    : "Resume setup"}
                </button>
              </form>
            </section>
          )}

          {capability &&
            status &&
            mode !== "resume" && (
              <div className="mt-8">
                <section
                  className="
                    mb-6
                    rounded-2xl
                    border
                    p-5
                    md:p-6
                  "
                  style={{
                    borderColor:
                      "var(--border)",

                    background:
                      "var(--card-bg)",
                  }}
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <h2 className="text-xl font-semibold">
                        Legal policies
                      </h2>

                      <p className="mt-1 text-sm opacity-70">
                        {ownerEmail}
                      </p>
                    </div>

                    <div
                      className="
                        rounded-full
                        border
                        px-4
                        py-2
                        text-sm
                        font-semibold
                      "
                      style={{
                        borderColor:
                          "var(--turquoise)",
                      }}
                    >
                      {publishedCount} / 9
                      published
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {POLICY_TYPES.map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setSelectedType(
                              type
                            )
                          }
                          className="
                            rounded-xl
                            border
                            p-4
                            text-left
                            transition
                          "
                          style={{
                            borderColor:
                              selectedType ===
                              type
                                ? "var(--turquoise)"
                                : "var(--border)",

                            background:
                              selectedType ===
                              type
                                ? "var(--bg)"
                                : "var(--card-bg)",
                          }}
                        >
                          <p className="font-semibold">
                            {
                              TYPE_LABELS[
                                type
                              ]
                            }
                          </p>

                          <p className="mt-1 text-xs opacity-65">
                            {
                              familySummary[
                                type
                              ]
                            }{" "}
                            / 3 published
                          </p>
                        </button>
                      )
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {POLICY_LANGUAGES.map(
                      (lang) => {
                        const published =
                          status
                            ?.policies
                            ?.[selectedType]
                            ?.[lang]
                            ?.published ===
                          true;

                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() =>
                              setSelectedLang(
                                lang
                              )
                            }
                            className="
                              rounded-lg
                              border
                              px-4
                              py-2
                              text-sm
                              font-semibold
                              transition
                            "
                            style={{
                              borderColor:
                                selectedLang ===
                                lang
                                  ? "var(--turquoise)"
                                  : "var(--border)",

                              background:
                                published
                                  ? "var(--turquoise)"
                                  : "var(--card-bg)",

                              color:
                                published
                                  ? "var(--navy)"
                                  : "var(--text)",
                            }}
                          >
                            {
                              LANGUAGE_LABELS[
                                lang
                              ]
                            }
                            {published
                              ? " ✓"
                              : ""}
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>

                <BootstrapPolicyEditor
                  type={selectedType}
                  lang={selectedLang}
                  value={
                    selectedDraft.content
                  }
                  changeNote={
                    selectedDraft.changeNote
                  }
                  published={
                    selectedPublished
                  }
                  publishing={
                    publishingKey ===
                    selectedKey
                  }
                  onContentChange={(
                    value
                  ) =>
                    updateDraft(
                      "content",
                      value
                    )
                  }
                  onChangeNoteChange={(
                    value
                  ) =>
                    updateDraft(
                      "changeNote",
                      value
                    )
                  }
                  onPublish={
                    publishSelectedPolicy
                  }
                />

                <section
                  className="
                    mt-6
                    rounded-2xl
                    border
                    p-5
                    md:p-6
                  "
                  style={{
                    borderColor:
                      allPublished
                        ? "var(--turquoise)"
                        : "var(--border)",

                    background:
                      "var(--card-bg)",
                  }}
                >
                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <h2 className="text-lg font-semibold">
                        Review & activate
                      </h2>

                      <p className="mt-1 max-w-2xl text-sm opacity-70">
                        All nine initial policies
                        must be published before the
                        first SuperAdmin can review
                        the canonical policy bundle
                        and activate the normal admin
                        session.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        !allPublished ||
                        mode ===
                          "completing"
                      }
                      onClick={() => {
                        setError("");
                        setMessage("");
                        setMode("review");
                        setShowConsentReview(
                          true
                        );
                      }}
                      className="
                        rounded-lg
                        bg-turquoise
                        px-5
                        py-2.5
                        font-semibold
                        text-navy
                        shadow-md
                        transition
                        hover:bg-turquoise/90
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      Review & complete setup
                    </button>
                  </div>
                </section>
              </div>
            )}
        </div>
      </main>

      <Footer />

      {showConsentReview && (
        <ConsentReviewModal
          initialLanguage={language}
          onClose={() => {
            setShowConsentReview(
              false
            );

            if (
              mode === "review"
            ) {
              setMode("legal");
            }
          }}
          onConfirmed={
            completeBootstrap
          }
        />
      )}
    </div>
  );
}
