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
    }, 10000);

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
              filter: 'brightness(0.5)', // تاریک کردن نقشه
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
              animation: 'fadeInLogo 2s ease-out', // انیمیشن برای لوگو
            }}
          >
            <img
              src="/IranConnect Dark.gif"
              alt="Logo Motion"
              style={{
                width: '50%',
                maxWidth: '300px',
                marginBottom: '30px',
                animation: 'scaleIn 2s ease-out', // انیمیشن scale-in برای لوگو
              }}
            />
            <div
              className="welcome-text"
              style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: 'bold',
                animation: 'fadeInText 3s ease-in-out', // انیمیشن برای متن
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

      // ایجاد انیمیشن برای نقاط
      points.forEach((point, index) => {
        const radius = Math.abs(Math.sin(Date.now() / 500 + index) * 5); // تغییر اندازه دایره‌ها برای ایجاد جلوه زنده
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.fill();
      });

      // خطوط متحرک
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 10]); // برای خط‌چین
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
