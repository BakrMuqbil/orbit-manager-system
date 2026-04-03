import React, { useState } from 'react';
import styles from './items.module.css';

// 1. Cloud Loader (النسخة النهائية المصغرة مع نص متحرك)
export const CloudLoader = ({ message = "Loading", customClass = "", style = {} }) => {
  return (
      <div className={`${styles.loaderWrapper} ${customClass}`} style={style}>
      <div className={styles.loaderContent}>
      
      
        <svg 
          className={styles.svgGlobal} 
          viewBox="0 0 94 136" 
          height="80" 
          width="60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            className={styles.lineV1} 
            d="M87.3629 108.433L49.1073 85.3765C47.846 84.6163 45.8009 84.6163 44.5395 85.3765L6.28392 108.433C5.02255 109.194 5.02255 110.426 6.28392 111.187L44.5395 134.243C45.8009 135.004 47.846 135.004 49.1073 134.243L87.3629 111.187C88.6243 110.426 88.6243 109.194 87.3629 108.433Z" 
            stroke="#4B22B5" 
          />
          <path 
            className={styles.lineV2} 
            d="M91.0928 95.699L49.2899 70.5042C47.9116 69.6734 45.6769 69.6734 44.2986 70.5042L2.49568 95.699C1.11735 96.5298 1.11735 97.8767 2.49568 98.7074L44.2986 123.902C45.6769 124.733 47.9116 124.733 49.2899 123.902L91.0928 98.7074C92.4712 97.8767 92.4712 96.5298 91.0928 95.699Z" 
            stroke="#5728CC" 
          />
          
          <g className={styles.nodeServer}>
            <path d="M2.48637 72.0059L43.8699 96.9428C45.742 98.0709 48.281 97.8084 50.9284 96.2133L91.4607 71.7833C92.1444 71.2621 92.4197 70.9139 92.5421 70.1257V86.1368C92.5421 86.9686 92.0025 87.9681 91.3123 88.3825C84.502 92.4724 51.6503 112.204 50.0363 113.215C48.2352 114.343 45.3534 114.343 43.5523 113.215C41.9261 112.197 8.55699 91.8662 2.08967 87.926C1.39197 87.5011 1.00946 86.5986 1.00946 85.4058V70.1257C1.11219 70.9289 1.49685 71.3298 2.48637 72.0059Z" fill="url(#paint0_linear)" />
            <path d="M91.0928 68.7324L49.2899 43.5375C47.9116 42.7068 45.6769 42.7068 44.2986 43.5375L2.49568 68.7324C1.11735 69.5631 1.11735 70.91 2.49568 71.7407L44.2986 96.9356C45.6769 97.7663 47.9116 97.7663 49.2899 96.9356L91.0928 71.7407C92.4712 70.91 92.4712 69.5631 91.0928 68.7324Z" fill="url(#paint1_linear)" stroke="url(#paint2_linear)" />
          </g>

          <g className={styles.particlesGroup}>
            <path className={`${styles.particleItem} ${styles.p1}`} d="M47.7634 33.1533L37.8159 27.2458C37.4646 27.037 36.8941 27.037 36.5427 27.2458L26.5952 33.1533C26.2439 33.3621 26.2439 33.6983 26.5952 33.9071L36.5427 39.8146C36.8941 40.0234 37.4646 40.0234 37.8159 39.8146L47.7634 33.9071C48.1147 33.6983 48.1147 33.3621 47.7634 33.1533Z" fill="url(#paint3_linear)" />
            <path className={`${styles.particleItem} ${styles.p2}`} d="M63.8587 31.4141L56.7604 27.1945C56.5095 27.0453 56.1019 27.0453 55.851 27.1945L48.7528 31.4141C48.5018 31.5632 48.5018 31.8034 48.7528 31.9525L55.851 36.1721C56.1019 36.3212 56.5095 36.3212 56.7604 36.1721L63.8587 31.9525C64.1097 31.8034 64.1097 31.5632 63.8587 31.4141Z" fill="url(#paint4_linear)" />
            <path className={`${styles.particleItem} ${styles.p3}`} d="M36.1625 21.0566L29.0642 16.837C28.8133 16.6878 28.4058 16.6878 28.1548 16.837L21.0566 21.0566C20.8056 21.2057 20.8056 21.4459 21.0566 21.595L28.1548 25.8146C28.4058 25.9637 28.8133 25.9637 29.0642 25.8146L36.1625 21.595C36.4135 21.4459 36.4135 21.2057 36.1625 21.0566Z" fill="url(#paint5_linear)" />
            <path className={`${styles.particleItem} ${styles.p4}`} d="M51.954 19.3174L47.2218 16.5043C47.0545 16.4049 46.7828 16.4049 46.6156 16.5043L41.8834 19.3174C41.7161 19.4168 41.7161 19.5769 41.8834 19.6763L46.6156 22.4894C46.7828 22.5888 47.0545 22.5888 47.2218 22.4894L51.954 19.6763C52.1213 19.5769 52.1213 19.4168 51.954 19.3174Z" fill="url(#paint6_linear)" />
            <path className={`${styles.particleItem} ${styles.p5}`} d="M42.222 10.6055L37.4898 7.79237C37.3226 7.69299 37.0509 7.69299 36.8836 7.79237L32.1514 10.6055C31.9841 10.7049 31.9841 10.865 32.1514 10.9643L36.8836 13.7775C37.0509 13.8769 37.3226 13.8769 37.4898 13.7775L42.222 10.9643C42.3893 10.865 42.3893 10.7049 42.222 10.6055Z" fill="url(#paint7_linear)" />
          </g>

          <defs>
            <linearGradient id="paint0_linear" x1="1.00946" y1="92.0933" x2="92.5421" y2="92.0933" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5727CC" />
              <stop offset="1" stopColor="#4354BF" />
            </linearGradient>
            <linearGradient id="paint1_linear" x1="1.54346" y1="69.8354" x2="92.045" y2="69.8354" gradientUnits="userSpaceOnUse">
              <stop stopColor="#713DFF" />
              <stop offset="1" stopColor="#4B63FF" />
            </linearGradient>
            <linearGradient id="paint2_linear" x1="1.54346" y1="69.8354" x2="92.045" y2="69.8354" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" stopOpacity="0.3" />
              <stop offset="1" stopColor="#91DDFB" />
            </linearGradient>
            <linearGradient id="paint3_linear" x1="26.314" y1="33.5302" x2="48.0447" y2="33.5302" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" />
              <stop offset="1" stopColor="#91DDFB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint4_linear" x1="48.5519" y1="31.6833" x2="64.0596" y2="31.6833" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" />
              <stop offset="1" stopColor="#91DDFB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint5_linear" x1="20.8558" y1="21.3258" x2="36.3635" y2="21.3258" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" />
              <stop offset="1" stopColor="#91DDFB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint6_linear" x1="41.7495" y1="19.4969" x2="52.0879" y2="19.4969" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" />
              <stop offset="1" stopColor="#91DDFB" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint7_linear" x1="32.0175" y1="10.7849" x2="42.3559" y2="10.7849" gradientUnits="userSpaceOnUse">
              <stop stopColor="#91DDFB" />
              <stop offset="1" stopColor="#91DDFB" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.loadingContainer}>
          <span className={styles.loadingText}>{message}</span>
          <span className={styles.dots}></span>
        </div>
      </div>
    </div>
  );
};

// Droplist و Calendar تبقى كما هي بالأسفل
export const Droplist = ({ options = ["Concept 1", "Concept 2", "Concept 3"] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  return (
    <div className={styles.droplistContainer}>
      <div className={styles.droplistHeader} onClick={() => setIsOpen(!isOpen)}>
        <span>{selected}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      <ul className={`${styles.optionsList} ${isOpen ? styles.optionsListOpen : ''}`}>
        {options.map((opt, i) => (
          <li key={i} className={`${styles.optionItem} ${selected === opt ? styles.optionActive : ''}`} onClick={() => { setSelected(opt); setIsOpen(false); }}>{opt}</li>
        ))}
      </ul>
    </div>
  );
};

export const Calendar = () => {
  const [selectedDay, setSelectedDay] = useState(11);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div className={styles.calendarCard}>
      <div className={styles.calendarTitle}>مارس 2026</div>
      <div className={styles.calendarGrid}>
        {days.map(day => (
          <div key={day} className={`${styles.day} ${selectedDay === day ? styles.daySelected : ''}`} onClick={() => setSelectedDay(day)}>{day}</div>
        ))}
      </div>
    </div>
  );
};

// 4. Empty Framed Card (المكون الجديد)
export const EmptyFramedCard = ({ children }) => {
  return (
    <div className={styles.emptyFramedCard}>
      <div className={styles.framedCardBorderTop}></div>
      {/* يمكنك وضع محتوى مخصص هنا عبر prop children إذا أردت لاحقاً */}
      {children}
    </div>
  );
};
