//pages/business/[id]V2.js
import Head from "next/head";

export async function getServerSideProps(context) {
    const { id } = context.params;
  
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE || "https://api.iranconnect.org";
  
      const res = await fetch(`${apiBase}/businesses/${id}`);
  
      if (!res.ok) {
        return { notFound: true };
      }
  
      const data = await res.json();
  
      if (data?.slug) {
        return {
          redirect: {
            destination: `/business/${data.slug}`,
            permanent: true, // 🔥 مهم
          },
        };
      }
  
      return { notFound: true };
    } catch {
      return { notFound: true };
    }
  }  

export default function DetailV2() {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div style={{ textAlign: "center", marginTop: "60px" }}>
        Redirecting...
      </div>
    </>
  );
}
