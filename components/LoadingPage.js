// /components/LoadingPage.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const LoadingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      router.push('/'); // هدایت به صفحه اصلی
    }, 20000); // 20 ثانیه

    return () => clearTimeout(timer); // تمیز کردن تایمر
  }, []);

  const handleClick = () => {
    setIsLoading(false);
    router.push('/');
  };

  return (
    <div
      onClick={handleClick}
      className="loading-page"
      style={{
        position: 'relative',
        height: '100vh',
        backgroundColor: '#18224B', // پس‌زمینه سرمه‌ای
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {isLoading && (
        <>
          {/* متن دلگرم‌کننده سمت چپ */}
          <div
            className="left-text"
            style={{
              position: 'absolute',
              left: '5%',
              zIndex: 3,
              textAlign: 'left',
              maxWidth: '45%',
              animation: 'fadeInText 2s ease-in-out',
            }}
          >
            <p
              style={{
                color: 'white',
                fontSize: '24px',
                lineHeight: '1.5',
              }}
            >
              IranConnect is here to take care of everything for you, so you can relax and focus on what truly matters.
            </p>
          </div>

          {/* لوگو IranConnect */}
          <div
            className="right-logo"
            style={{
              position: 'absolute',
              right: '5%',
              zIndex: 2,
              textAlign: 'right',
            }}
          >
            <img
              src="/IranConnect Dark.gif" // لوگو انیمیشنی
              alt="Logo Motion"
              style={{
                width: '50%',
                maxWidth: '300px',
                marginBottom: '30px',
                animation: 'scaleIn 2s ease-out',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LoadingPage;
