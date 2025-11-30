// /components/LoadingPage.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const LoadingPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // تغییر صفحه بعد از 10 ثانیه یا با کلیک کاربر
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      router.push('/'); // به صفحه اصلی هدایت می‌شود
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // تغییر صفحه با کلیک
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
        backgroundColor: '#000', // بک‌گراند تاریک
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {isLoading && (
        <>
          {/* لایه نقشه و خطوط اتصال */}
          <div
            className="map-animation"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/world-map.svg)', // نقشه دنیا
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 1,
              filter: 'brightness(0.6)', // تاریک کردن نقشه
            }}
          ></div>

          <div
            className="overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // فیلتر تیره
              zIndex: 2,
            }}
          ></div>

          {/* لوگو IranConnect */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              textAlign: 'center',
            }}
          >
            <img
              src="/IranConnect Dark.gif"
              alt="Logo Motion"
              style={{
                width: '50%',
                maxWidth: '300px', // اندازه مناسب برای موبایل و دسکتاپ
                marginBottom: '30px',
                animation: 'fadeInLogo 3s ease-in-out', // انیمیشن fade-in
              }}
            />
            <div
              className="welcome-text"
              style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: 'bold',
                animation: 'fadeInText 2s ease-in-out',
              }}
            >
              <p>Connecting Iranians Around the World</p>
            </div>
          </div>

          {/* نقاط متحرک و خطوط اتصال */}
          <CanvasMap />
        </>
      )}
    </div>
  );
};

const CanvasMap = () => {
  useEffect(() => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const points = [
      { x: 100, y: 100 }, // نقاط متحرک
      { x: 300, y: 200 },
      { x: 400, y: 350 },
      { x: 600, y: 500 },
      { x: 800, y: 400 },
    ];

    const drawPoints = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      });

      // خطوط اتصال (با انیمیشن)
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    const animate = () => {
      drawPoints();
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return <canvas id="canvas" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}></canvas>;
};

export default LoadingPage;
