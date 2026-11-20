import Head from "next/head";

const SITE_NAME = "IranConnect";

const DEFAULT_DESCRIPTION =
  "Discover Iranian professionals, local services, and Iranian-owned businesses.";

export default function SiteHead({
  title,
  description = DEFAULT_DESCRIPTION,
  socialTitle,
  socialDescription,
  socialImage,
  canonicalUrl,
}) {
  const pageTitle = title || SITE_NAME;
  const ogTitle = socialTitle || pageTitle;
  const ogDescription = socialDescription || description;

  return (
    <Head>
      <title>{pageTitle}</title>

      <meta name="description" content={description} />

      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />

      {canonicalUrl && (
        <>
          <link rel="canonical" href={canonicalUrl} />
          <meta property="og:url" content={canonicalUrl} />
        </>
      )}

      {socialImage && (
        <meta property="og:image" content={socialImage} />
      )}

      <meta
        name="twitter:card"
        content={socialImage ? "summary_large_image" : "summary"}
      />
    </Head>
  );
}
