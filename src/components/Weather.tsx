/**
 * 오늘의 충주 날씨 (머리글에 작게).
 * 네이버 날씨는 공개 API가 없어서, 키 없이 쓸 수 있는 Open-Meteo로 충주캠퍼스 좌표의 날씨를 받고
 * 누르면 네이버 날씨 검색으로 이동한다. 30분 동안은 다시 받지 않는다.
 */
import { useEffect, useState } from 'react';

const URL_API =
  'https://api.open-meteo.com/v1/forecast?latitude=36.97&longitude=127.87' +
  '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&timezone=Asia%2FSeoul&forecast_days=1';
const NAVER = 'https://search.naver.com/search.naver?query=%EC%B6%A9%EC%A3%BC+%EB%82%A0%EC%94%A8';
const CACHE_KEY = 'knut-guide:weather';

interface Wx {
  temp: number;
  code: number;
  max: number;
  min: number;
  rain: number | null;
  at: number;
}

/** WMO 날씨 코드 → 아이콘·한국어 */
export function describe(code: number): [string, string] {
  if (code === 0) return ['☀️', '맑음'];
  if (code <= 2) return ['🌤️', '구름 조금'];
  if (code === 3) return ['☁️', '흐림'];
  if (code === 45 || code === 48) return ['🌫️', '안개'];
  if (code >= 51 && code <= 57) return ['🌦️', '이슬비'];
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ['🌧️', '비'];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['🌨️', '눈'];
  if (code >= 95) return ['⛈️', '뇌우'];
  return ['🌡️', '날씨'];
}

export function Weather() {
  const [wx, setWx] = useState<Wx | null>(null);

  useEffect(() => {
    let cached: Wx | null = null;
    try {
      cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
    } catch {
      cached = null;
    }
    if (cached && Date.now() - cached.at < 30 * 60 * 1000) {
      setWx(cached);
      return;
    }
    const ctrl = new AbortController();
    fetch(URL_API, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const next: Wx = {
          temp: Math.round(d.current.temperature_2m),
          code: d.current.weather_code,
          max: Math.round(d.daily.temperature_2m_max[0]),
          min: Math.round(d.daily.temperature_2m_min[0]),
          rain: d.daily.precipitation_probability_max?.[0] ?? null,
          at: Date.now(),
        };
        setWx(next);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* 저장 못 해도 표시는 된다 */
        }
      })
      .catch(() => {
        /* 날씨를 못 받으면 칩을 숨긴다 */
      });
    return () => ctrl.abort();
  }, []);

  if (!wx) return null;
  const [icon, text] = describe(wx.code);
  return (
    <a
      className="weather"
      href={NAVER}
      target="_blank"
      rel="noopener noreferrer"
      title={`충주 오늘 ${text}, 최고 ${wx.max}° 최저 ${wx.min}°${wx.rain !== null ? `, 강수확률 ${wx.rain}%` : ''} — 네이버 날씨에서 자세히 보기`}
    >
      <span className="wx-icon" aria-hidden="true">{icon}</span>
      <span>
        충주 <b>{wx.temp}°</b>
      </span>
      <span className="muted" style={{ fontSize: 12 }}>
        {wx.max}°/{wx.min}°
      </span>
    </a>
  );
}
