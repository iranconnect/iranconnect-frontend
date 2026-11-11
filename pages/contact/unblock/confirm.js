import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import apiClient from '../../../utils/apiClient';

export default function UnblockConfirmationPage() {
  const router = useRouter();
  const tokenRef = useRef(null);

  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const token = router.query.token;

    if (typeof token !== 'string' || !token.trim()) {
      setStatus('invalid');
      return;
    }

    tokenRef.current = token;

    // Remove the sensitive token from the visible URL.
    window.history.replaceState(
      window.history.state,
      '',
      '/contact/unblock/confirm'
    );

    let active = true;

    async function verify() {
      try {
        const response = await apiClient.get(
          '/contact/unblock/confirm',
          { params: { token } }
        );

        if (!active) return;

        if (
          response.status === 200 &&
          response.data?.valid === true
        ) {
          setStatus('valid');
        } else {
          tokenRef.current = null;
          setStatus('invalid');
        }
      } catch (err) {
        if (!active) return;

        if (err.response?.status === 503) {
          setStatus('unavailable');
        } else {
          tokenRef.current = null;
          setStatus('invalid');
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [router.isReady, router.query.token]);

  async function handleConfirm() {
    if (status !== 'valid' || !tokenRef.current) return;

    setStatus('submitting');
    setError('');

    try {
      const response = await apiClient.post(
        '/contact/unblock/confirm',
        { token: tokenRef.current }
      );

      if (
        response.status !== 200 ||
        response.data?.success !== true
      ) {
        throw new Error('Unexpected confirmation response');
      }

      tokenRef.current = null;
      setStatus('success');
    } catch (err) {
      if (err.response?.status === 400) {
        tokenRef.current = null;
        setStatus('invalid');
      } else {
        setError(
          'Confirmation is temporarily unavailable. Please try again.'
        );
        setStatus('valid');
      }
    }
  }

  return (
    <>
      <Head>
        <title>Confirm Support Request | IranConnect</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>

      <div className="min-h-screen flex flex-col bg-pagebg text-text">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <section className="w-full max-w-md rounded-xl border border-gray-200 p-6">
            <h1 className="text-2xl font-semibold mb-4">
              Confirm Account Unblock Request
            </h1>

            {status === 'checking' && (
              <p role="status">Checking your verification link...</p>
            )}

            {status === 'invalid' && (
              <p role="alert">
                This verification link is invalid or has expired.
              </p>
            )}

            {status === 'unavailable' && (
              <p role="alert">
                Verification is temporarily unavailable.
                Please reopen your link later.
              </p>
            )}

            {status === 'valid' && (
              <>
                <p className="mb-4">
                  Your verification link is valid.
                  Confirm to submit your account unblock request
                  for manual review.
                </p>

                {error && (
                  <p role="alert" className="mb-3 text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn-primary w-full"
                >
                  Confirm Support Request
                </button>
              </>
            )}

            {status === 'submitting' && (
              <p role="status">Submitting your request...</p>
            )}

            {status === 'success' && (
              <p role="status">
                Your support request has been submitted.
                Our team will review it.
              </p>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
