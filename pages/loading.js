//pages/loading.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/loadingPage.css';

const LoadingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // بعد از ۱۰ ثانیه یا با کلیک، صفحه اصلی نمایش داده می‌شود
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      router.push('/home'); // صفحه هوم که پس از لودینگ نمایش داده می‌شود
    }, 10000);

    return () => clearTimeout(timer); // تمیز کردن تایمر
  }, []);

  // تغییر صفحه با کلیک
  const handleClick = () => {
    setIsLoading(false);
    router.push('/home');
  };

  return (
    <div
      onClick={handleClick}
      className="loading-page"
      style={{
        position: 'relative',
        height: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {isLoading && (
        <>
          <div
            className="overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)', // فیلتر تیره
              zIndex: 1,
            }}
          ></div>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              textAlign: 'center',
              borderRadius: '20px',
              padding: '30px',
              background: 'rgba(255, 255, 255, 0.9)', // نئومورفیک سفید
              boxShadow: '10px 10px 15px rgba(0, 0, 0, 0.1), -10px -10px 15px rgba(255, 255, 255, 0.8)', // اثر نئومورفیک
            }}
          >
            {/* لوگو IranConnect */}
            <img
              src="/IranConnect Dark.gif"
              alt="Logo Motion"
              style={{
                width: '50%',
                maxWidth: '300px', // سایز متناسب برای موبایل و دسکتاپ
                marginBottom: '20px',
              }}
            />

            <div
              className="welcome-text"
              style={{
                color: '#18224B', // رنگ سرمه‌ای برند ایران کانکت
                fontSize: '18px',
                animation: 'fadeIn 2s ease-in-out',
              }}
            >
              <p>Welcome to IranConnect!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoadingPage;
