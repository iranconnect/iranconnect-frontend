//components/LoadingPage.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

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
      style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}
    >
      {isLoading && (
        <>
          <video
            autoPlay
            loop
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src="/path/to/video/copy_2465E3FD-A463-451C-BA84-E3F49FC5F1DA.MOV" type="video/mp4" />
          </video>

          <div
            className="overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.4)', // فیلتر تیره
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
            }}
          >
            {/* لوگو موشن */}
            <img
              src="/path/to/IranConnect Dark.gif"
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
                color: 'white',
                fontSize: '18px',
                animation: 'fadeIn 2s ease-in-out',
              }}
            >
              <p>خوش آمدید به ایران کانکت!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoadingPage;
