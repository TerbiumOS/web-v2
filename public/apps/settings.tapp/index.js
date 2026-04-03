const iconSet = {
	settings: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.078 2.25C10.161 2.25 9.379 2.913 9.228 3.817L9.05 4.889C9.03 5.009 8.935 5.149 8.753 5.237C8.41035 5.40171 8.08073 5.59226 7.767 5.807C7.601 5.922 7.433 5.933 7.317 5.89L6.3 5.508C5.88424 5.35224 5.4267 5.34906 5.00882 5.49904C4.59093 5.64901 4.23983 5.94241 4.018 6.327L3.096 7.924C2.87409 8.30836 2.79571 8.75897 2.87482 9.19569C2.95392 9.6324 3.18537 10.0269 3.528 10.309L4.368 11.001C4.463 11.079 4.538 11.23 4.522 11.431C4.4935 11.8101 4.4935 12.1909 4.522 12.57C4.537 12.77 4.463 12.922 4.369 13L3.528 13.692C3.18537 13.9741 2.95392 14.3686 2.87482 14.8053C2.79571 15.242 2.87409 15.6926 3.096 16.077L4.018 17.674C4.23999 18.0584 4.59116 18.3516 5.00903 18.5014C5.42689 18.6512 5.88435 18.6478 6.3 18.492L7.319 18.11C7.434 18.067 7.602 18.079 7.769 18.192C8.081 18.406 8.41 18.597 8.754 18.762C8.936 18.85 9.031 18.99 9.051 19.112L9.229 20.183C9.38 21.087 10.162 21.75 11.079 21.75H12.923C13.839 21.75 14.622 21.087 14.773 20.183L14.951 19.111C14.971 18.991 15.065 18.851 15.248 18.762C15.592 18.597 15.921 18.406 16.233 18.192C16.4 18.078 16.568 18.067 16.683 18.11L17.703 18.492C18.1185 18.6472 18.5756 18.6501 18.993 18.5002C19.4105 18.3502 19.7612 18.0571 19.983 17.673L20.906 16.076C21.1279 15.6916 21.2063 15.241 21.1272 14.8043C21.0481 14.3676 20.8166 13.9731 20.474 13.691L19.634 12.999C19.539 12.921 19.464 12.77 19.48 12.569C19.5084 12.1899 19.5084 11.8091 19.48 11.43C19.464 11.23 19.539 11.078 19.633 11L20.473 10.308C21.181 9.726 21.364 8.718 20.906 7.923L19.984 6.326C19.762 5.94159 19.4108 5.6484 18.993 5.49861C18.5751 5.34883 18.1176 5.35215 17.702 5.508L16.682 5.89C16.568 5.933 16.4 5.921 16.233 5.807C15.9196 5.5923 15.5903 5.40175 15.248 5.237C15.065 5.15 14.971 5.01 14.951 4.889L14.772 3.817C14.6991 3.37906 14.4731 2.98122 14.1343 2.69427C13.7956 2.40732 13.366 2.24989 12.922 2.25H11.079H11.078ZM12 15.75C12.9946 15.75 13.9484 15.3549 14.6516 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6516 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75Z" fill="#ffffff"/></svg>`,
	brush: `<svg viewBox="0 0 56 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M51.1399 0C50.1785 0 49.2401 0.290703 48.4423 0.838062L35.453 9.70318C32.1936 11.9295 29.2129 14.5567 26.5778 17.526C31.9906 20.1321 36.3451 24.5921 38.8895 30.1362C41.7886 27.4363 44.3536 24.3825 46.5271 21.0432L55.185 7.74159C55.6725 6.99155 55.9522 6.12012 55.9944 5.22011C56.0366 4.3201 55.8396 3.42523 55.4245 2.6308C55.0094 1.83637 54.3917 1.17214 53.6372 0.70886C52.8827 0.245578 52.0196 0.000593152 51.1399 0ZM29.9171 36.7307C31.5934 35.7772 33.2123 34.7216 34.7651 33.5696C33.7331 30.8959 32.1766 28.4676 30.1917 26.4346C28.2069 24.4016 25.836 22.8074 23.2256 21.7503C22.1009 23.3399 21.0703 24.9972 20.1394 26.7132L19.4285 28.0227C21.6176 28.6678 23.6109 29.8718 25.2214 31.5218C26.8319 33.1718 28.0069 35.2137 28.6361 37.4561L29.9197 36.7281L29.9171 36.7307ZM15.7286 31.4273C13.1856 31.4273 10.7467 32.462 8.94845 34.3038C7.15024 36.1456 6.14002 38.6436 6.14002 41.2483C6.14016 41.7866 6.03231 42.3191 5.82315 42.8129C5.61399 43.3067 5.30798 43.7512 4.92413 44.1188C4.54027 44.4865 4.08675 44.7694 3.59171 44.95C3.09666 45.1306 2.57066 45.2051 2.04633 45.1689C1.69965 45.145 1.35314 45.2181 1.04384 45.3803C0.734547 45.5424 0.474081 45.7876 0.290276 46.0897C0.106472 46.3917 0.00623676 46.7392 0.000281733 47.095C-0.00567329 47.4509 0.0828754 47.8017 0.256466 48.11C1.73155 50.7346 4.01139 52.787 6.74202 53.9485C9.47265 55.11 12.5013 55.3157 15.3577 54.5335C18.2141 53.7513 20.7385 52.0251 22.539 49.6229C24.3394 47.2206 25.3151 44.2768 25.3146 41.2483C25.3146 39.9586 25.0666 38.6815 24.5847 37.49C24.1029 36.2985 23.3966 35.2158 22.5062 34.3038C21.6158 33.3919 20.5588 32.6684 19.3954 32.1749C18.2321 31.6813 16.9878 31.4273 15.7286 31.4273Z" fill="white"/></svg>`,
	globe: `<svg viewBox="0 0 56 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M55.914 29.6267C56.3033 24.7567 55.3665 19.8726 53.2004 15.4779C49.615 18.8331 45.3766 21.4383 40.7411 23.1363C41.1138 27.6423 40.9073 32.1767 40.1266 36.6318C45.7675 35.2326 51.1125 32.861 55.914 29.6267ZM35.5638 37.5396C36.4809 33.2212 36.8016 28.8006 36.5171 24.3976C33.7835 25.0396 30.9321 25.379 28.0003 25.379C25.0685 25.379 22.2171 25.0396 19.4835 24.3976C19.2056 28.8005 19.5263 33.2203 20.4368 37.5396C25.4499 38.2964 30.5507 38.2964 35.5638 37.5396ZM21.6026 41.9768C25.8529 42.4721 30.1477 42.4721 34.398 41.9768C32.9372 46.608 30.7807 50.9977 28.0003 55C25.2198 50.9977 23.0633 46.608 21.6026 41.9768ZM15.874 36.6346C15.0891 32.1781 14.8826 27.6413 15.2595 23.1335C10.6229 21.4359 6.38354 18.8307 2.79729 15.4751C0.631666 19.8708 -0.304067 24.756 0.0866137 29.6267C4.88813 32.861 10.2331 35.2354 15.874 36.6346ZM54.8659 35.2828C53.4161 40.1214 50.6482 44.4765 46.8627 47.8752C43.0772 51.2739 38.4187 53.5864 33.3929 54.5616C35.9099 50.3938 37.8308 45.9039 39.1015 41.2189C44.642 40.0752 49.963 38.0725 54.8659 35.2856V35.2828ZM1.1347 35.2828C5.96454 38.0288 11.271 40.0566 16.8991 41.2189C18.1698 45.9039 20.0907 50.3938 22.6077 54.5616C17.5822 53.5866 12.924 51.2745 9.13851 47.8764C5.35303 44.4782 2.58495 40.1237 1.1347 35.2856V35.2828ZM33.3929 0.43552C40.5077 1.81281 46.803 5.8536 50.9549 11.7081C47.8901 14.7579 44.2314 17.1665 40.1984 18.7896C39.1117 12.3072 36.8035 6.08212 33.3929 0.43552ZM28.0003 0C32.191 6.02969 34.9444 12.9139 36.0548 20.1386C33.4791 20.789 30.7799 21.1369 28.0003 21.1369C25.2207 21.1369 22.5215 20.7919 19.9458 20.1386C21.0561 12.9139 23.8095 6.02964 28.0003 0ZM22.6077 0.43552C19.197 6.08209 16.8888 12.3072 15.8022 18.7896C11.7691 17.1666 8.11043 14.7579 5.04566 11.7081C9.19794 5.85445 15.4932 1.81182 22.6077 0.43552Z" fill="white"/></svg>`,
	apps: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.25 3.75A1.5 1.5 0 0 0 3.75 5.25v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3ZM5.25 14.25a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3ZM14.25 5.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3ZM15.75 14.25a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-3Z"/></svg>`,
	account: `<svg viewBox="0 0 42 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.54423 11.7857C9.54423 8.65994 10.7512 5.6622 12.8995 3.45195C15.0479 1.2417 17.9617 0 21 0C24.0383 0 26.9521 1.2417 29.1004 3.45195C31.2488 5.6622 32.4558 8.65994 32.4558 11.7857C32.4558 14.9115 31.2488 17.9092 29.1004 20.1195C26.9521 22.3297 24.0383 23.5714 21 23.5714C17.9617 23.5714 15.0479 22.3297 12.8995 20.1195C10.7512 17.9092 9.54423 14.9115 9.54423 11.7857ZM0.000303968 48.7273C0.0861465 43.0557 2.33637 37.6463 6.26524 33.6667C10.1941 29.6872 15.4865 27.4566 21 27.4566C26.5135 27.4566 31.8059 29.6872 35.7348 33.6667C39.6636 37.6463 41.9138 43.0557 41.9997 48.7273C42.0063 49.1092 41.9046 49.4847 41.707 49.808C41.5094 50.1312 41.2246 50.3883 40.8872 50.5476C34.6481 53.4906 27.8637 55.0095 21 55C13.9076 55 7.16907 53.4076 1.11279 50.5476C0.775442 50.3883 0.490548 50.1312 0.292966 49.808C0.095384 49.4847 -0.00631807 49.1092 0.000303968 48.7273Z" fill="white"/></svg>`,
	chain: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3731 8.17847C14.1229 8.53646 14.7758 9.06916 15.277 9.73182C15.7783 10.3945 16.1132 11.1678 16.2536 11.9867C16.394 12.8056 16.3358 13.6463 16.0839 14.438C15.8321 15.2298 15.3939 15.9496 14.8061 16.5369L9.61385 21.7292C8.6401 22.703 7.31942 23.25 5.94233 23.25C4.56524 23.25 3.24455 22.703 2.2708 21.7292C1.29705 20.7555 0.75 19.4348 0.75 18.0577C0.75 16.6806 1.29705 15.3599 2.2708 14.3861L4.2981 12.3588M19.7019 11.6412L21.7292 9.61385C22.703 8.6401 23.25 7.31942 23.25 5.94233C23.25 4.56524 22.703 3.24455 21.7292 2.2708C20.7555 1.29705 19.4348 0.75 18.0577 0.75C16.6806 0.75 15.3599 1.29705 14.3861 2.2708L9.19386 7.46309C8.60613 8.0504 8.16793 8.77018 7.91607 9.56196C7.66421 10.3537 7.60603 11.1944 7.74644 12.0133C7.88685 12.8322 8.22173 13.6055 8.72296 14.2682C9.22419 14.9308 9.87713 15.4635 10.6269 15.8215" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
	trash: `<svg viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 2.97795V3.20495C14.799 3.32373 16.0927 3.49454 17.378 3.71695C17.4751 3.73376 17.5678 3.76952 17.6511 3.82218C17.7343 3.87485 17.8063 3.9434 17.8631 4.02391C17.9198 4.10441 17.9601 4.19531 17.9817 4.2914C18.0033 4.38749 18.0058 4.4869 17.989 4.58395C17.9722 4.68099 17.9364 4.77378 17.8838 4.85701C17.8311 4.94023 17.7626 5.01227 17.682 5.06901C17.6015 5.12575 17.5106 5.16607 17.4146 5.18768C17.3185 5.20929 17.2191 5.21176 17.122 5.19495L16.913 5.15995L15.908 18.2299C15.8501 18.9835 15.5098 19.6875 14.9553 20.201C14.4008 20.7146 13.6728 20.9999 12.917 20.9999H5.08401C4.3282 20.9999 3.60026 20.7146 3.04573 20.201C2.4912 19.6875 2.15095 18.9835 2.09301 18.2299L1.08701 5.15995L0.878007 5.19495C0.78096 5.21176 0.681552 5.20929 0.58546 5.18768C0.489368 5.16607 0.398473 5.12575 0.317964 5.06901C0.15537 4.95442 0.0449542 4.77994 0.0110065 4.58395C-0.0229412 4.38795 0.0223602 4.1865 0.136945 4.02391C0.25153 3.86131 0.426012 3.7509 0.622007 3.71695C1.90727 3.49427 3.20099 3.32347 4.50001 3.20495V2.97795C4.50001 1.41395 5.71301 0.077948 7.31601 0.026948C8.43872 -0.00898265 9.56229 -0.00898265 10.685 0.026948C12.288 0.077948 13.5 1.41395 13.5 2.97795ZM7.36401 1.52595C8.45473 1.49106 9.54629 1.49106 10.637 1.52595C11.39 1.54995 12 2.18395 12 2.97795V3.09095C10.0018 2.96959 7.99817 2.96959 6.00001 3.09095V2.97795C6.00001 2.18395 6.60901 1.54995 7.36401 1.52595ZM7.00901 7.47095C7.0052 7.37246 6.98203 7.27568 6.94082 7.18614C6.89961 7.09661 6.84117 7.01606 6.76883 6.94911C6.69649 6.88216 6.61168 6.83011 6.51923 6.79594C6.42678 6.76177 6.3285 6.74614 6.23001 6.74995C6.13152 6.75376 6.03474 6.77693 5.9452 6.81814C5.85567 6.85935 5.77512 6.91779 5.70817 6.99012C5.64122 7.06246 5.58917 7.14728 5.555 7.23973C5.52083 7.33218 5.5052 7.43046 5.50901 7.52895L5.85601 16.5289C5.8637 16.7277 5.95004 16.9153 6.09604 17.0504C6.16833 17.1173 6.25309 17.1693 6.34548 17.2035C6.43787 17.2376 6.53608 17.2533 6.63451 17.2494C6.73293 17.2456 6.82964 17.2225 6.91912 17.1813C7.0086 17.1401 7.08909 17.0817 7.15599 17.0094C7.22289 16.9371 7.27491 16.8524 7.30905 16.76C7.3432 16.6676 7.35881 16.5694 7.35501 16.4709L7.00901 7.47095ZM12.489 7.52895C12.4963 7.42857 12.4834 7.32773 12.4509 7.23246C12.4185 7.13719 12.3672 7.04942 12.3001 6.97439C12.233 6.89936 12.1515 6.8386 12.0604 6.79574C11.9694 6.75287 11.8706 6.72877 11.77 6.72488C11.6694 6.72098 11.5691 6.73737 11.475 6.77307C11.3809 6.80877 11.2949 6.86304 11.2222 6.93266C11.1496 7.00227 11.0916 7.08581 11.0519 7.17829C11.0122 7.27077 10.9915 7.3703 10.991 7.47095L10.644 16.4709C10.6363 16.6699 10.708 16.8637 10.8432 17.0098C10.9784 17.1559 11.1661 17.2423 11.365 17.2499C11.5639 17.2576 11.7577 17.186 11.9038 17.0508C12.0499 16.9156 12.1363 16.7279 12.144 16.5289L12.489 7.52895Z" fill="white"/></svg>`,
	wifi: `<svg viewBox="0 0 56 55" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M55.914 29.6267C56.3033 24.7567 55.3665 19.8726 53.2004 15.4779C49.615 18.8331 45.3766 21.4383 40.7411 23.1363C41.1138 27.6423 40.9073 32.1767 40.1266 36.6318C45.7675 35.2326 51.1125 32.861 55.914 29.6267ZM35.5638 37.5396C36.4809 33.2212 36.8016 28.8006 36.5171 24.3976C33.7835 25.0396 30.9321 25.379 28.0003 25.379C25.0685 25.379 22.2171 25.0396 19.4835 24.3976C19.2056 28.8005 19.5263 33.2203 20.4368 37.5396C25.4499 38.2964 30.5507 38.2964 35.5638 37.5396ZM21.6026 41.9768C25.8529 42.4721 30.1477 42.4721 34.398 41.9768C32.9372 46.608 30.7807 50.9977 28.0003 55C25.2198 50.9977 23.0633 46.608 21.6026 41.9768ZM15.874 36.6346C15.0891 32.1781 14.8826 27.6413 15.2595 23.1335C10.6229 21.4359 6.38354 18.8307 2.79729 15.4751C0.631666 19.8708 -0.304067 24.756 0.0866137 29.6267C4.88813 32.861 10.2331 35.2354 15.874 36.6346ZM54.8659 35.2828C53.4161 40.1214 50.6482 44.4765 46.8627 47.8752C43.0772 51.2739 38.4187 53.5864 33.3929 54.5616C35.9099 50.3938 37.8308 45.9039 39.1015 41.2189C44.642 40.0752 49.963 38.0725 54.8659 35.2856V35.2828ZM1.1347 35.2828C5.96454 38.0288 11.271 40.0566 16.8991 41.2189C18.1698 45.9039 20.0907 50.3938 22.6077 54.5616C17.5822 53.5866 12.924 51.2745 9.13851 47.8764C5.35303 44.4782 2.58495 40.1237 1.1347 35.2856V35.2828ZM33.3929 0.43552C40.5077 1.81281 46.803 5.8536 50.9549 11.7081C47.8901 14.7579 44.2314 17.1665 40.1984 18.7896C39.1117 12.3072 36.8035 6.08212 33.3929 0.43552ZM28.0003 0C32.191 6.02969 34.9444 12.9139 36.0548 20.1386C33.4791 20.789 30.7799 21.1369 28.0003 21.1369C25.2207 21.1369 22.5215 20.7919 19.9458 20.1386C21.0561 12.9139 23.8095 6.02964 28.0003 0ZM22.6077 0.43552C19.197 6.08209 16.8888 12.3072 15.8022 18.7896C11.7691 17.1666 8.11043 14.7579 5.04566 11.7081C9.19794 5.85445 15.4932 1.81182 22.6077 0.43552Z" fill="white"/></svg>`,
};

const MAX_RECENT_ITEMS = 4;
const CAT_ORDER = ["general", "appearance", "internet", "apps", "account"];
const parser = window.parent?.tb?.system?.TSLParser;
const homeScreen = document.getElementById("homeScreen");
const detailScreen = document.getElementById("detailScreen");
const recentlyVisitedEl = document.getElementById("recentlyVisited");
const categoryGridEl = document.getElementById("categoryGrid");
const detailTitleEl = document.getElementById("detailTitle");
const detailSidebarEl = document.getElementById("detailSidebar");
const detailContentEl = document.getElementById("detailContent");
let categoryModels = [];
let recentItems = [];
let currentCategory = null;
let currentViewId = "";
let currentSearchTerm = "";
let navHistory = [];
let navFuture = [];

function getTitlebarEl(id) {
	return window.parent?.document?.getElementById(id) || null;
}

function styleNavButton(button, enabled) {
	if (!button) return;
	button.style.background = enabled ? "#4b8f4b" : "#ffffff14";
	button.style.color = enabled ? "#ffffff" : "#ffffff70";
	button.style.cursor = enabled ? "pointer" : "default";
}

function updateTitlebarNavState() {
	const backBtn = getTitlebarEl("settings-nav-back");
	const forwardBtn = getTitlebarEl("settings-nav-forward");
	styleNavButton(backBtn, navHistory.length > 1);
	styleNavButton(forwardBtn, navFuture.length > 0);
}

function currentRoute() {
	if (homeScreen && !homeScreen.classList.contains("hidden")) {
		return { screen: "home" };
	}
	if (currentSearchTerm) {
		return {
			screen: "search",
			searchTerm: currentSearchTerm,
		};
	}
	return {
		screen: "detail",
		categoryId: currentCategory?.id || "",
		viewId: currentViewId || "",
	};
}

function sameRoute(a, b) {
	if (!a || !b) return false;
	return a.screen === b.screen && (a.categoryId || "") === (b.categoryId || "") && (a.viewId || "") === (b.viewId || "") && (a.searchTerm || "") === (b.searchTerm || "");
}

function pushRoute(route) {
	const last = navHistory[navHistory.length - 1];
	if (!sameRoute(last, route)) {
		navHistory.push(route);
	}
	navFuture = [];
	updateTitlebarNavState();
}

async function navigateToRoute(route, opts = { push: true, reverse: false }) {
	if (!route) return;
	if (route.screen === "home") {
		currentSearchTerm = "";
		openHomeScreen();
		updateDetailTitle();
	} else if (route.screen === "search") {
		await openSearchResults(route.searchTerm || "", !!opts.reverse, !!opts.push);
	} else if (route.screen === "detail" && route.categoryId) {
		await openCategoryDetail(route.categoryId, route.viewId || undefined, !!opts.reverse, !!opts.push);
	}
	if (opts.push) {
		pushRoute(currentRoute());
	}
}

function bindTitlebarNav() {
	const backBtn = getTitlebarEl("settings-nav-back");
	const forwardBtn = getTitlebarEl("settings-nav-forward");
	const searchInput = getTitlebarEl("settings-nav-search");
	if (backBtn && !backBtn.dataset.boundSettingsNav) {
		backBtn.dataset.boundSettingsNav = "true";
		backBtn.addEventListener("click", async () => {
			if (navHistory.length <= 1) return;
			const current = navHistory.pop();
			if (current) navFuture.unshift(current);
			const previous = navHistory[navHistory.length - 1];
			if (!previous) return;
			await navigateToRoute(previous, { push: false, reverse: true });
			updateTitlebarNavState();
		});
	}
	if (forwardBtn && !forwardBtn.dataset.boundSettingsNav) {
		forwardBtn.dataset.boundSettingsNav = "true";
		forwardBtn.addEventListener("click", async () => {
			if (!navFuture.length) return;
			const next = navFuture.shift();
			if (!next) return;
			await navigateToRoute(next, { push: false, reverse: false });
			navHistory.push(next);
			updateTitlebarNavState();
		});
	}
	if (searchInput && !searchInput.dataset.boundSettingsNav) {
		searchInput.dataset.boundSettingsNav = "true";
		searchInput.addEventListener("keydown", async ev => {
			if (ev.key !== "Enter") return;
			const term = String(searchInput.value || "").trim();
			if (!term) {
				await navigateToRoute({ screen: "home" }, { push: true, reverse: true });
				return;
			}
			await navigateToRoute({ screen: "search", searchTerm: term }, { push: true, reverse: false });
		});
	}
	updateTitlebarNavState();
}

function mapIcon(iconValue) {
	const icon = String(iconValue || "").toLowerCase();
	if (icon.includes("palette") || icon.includes("paint") || icon.includes("brush")) return "brush";
	if (icon.includes("internet") || icon.includes("network") || icon.includes("public") || icon.includes("globe")) return "globe";
	if (icon.includes("account") || icon.includes("person") || icon.includes("user")) return "account";
	if (icon.includes("app")) return "apps";
	return "settings";
}

function orderCategory(a, b) {
	const aTitle = String(a?.title || "").toLowerCase();
	const bTitle = String(b?.title || "").toLowerCase();
	const ai = CAT_ORDER.findIndex(v => aTitle.includes(v));
	const bi = CAT_ORDER.findIndex(v => bTitle.includes(v));
	const av = ai === -1 ? 999 : ai;
	const bv = bi === -1 ? 999 : bi;
	if (av !== bv) return av - bv;
	return aTitle.localeCompare(bTitle);
}

function normalizeCategoryFromDoc(doc, sourcePath) {
	const rec = Array.isArray(doc?.ui?.recommendedOptions) ? doc.ui.recommendedOptions : [];
	const views = Array.isArray(doc?.ui?.views) ? doc.ui.views : [];
	const quickLinks = rec.slice(0, 3).map((opt, index) => ({
		id: opt.id || `${doc?.manifest?.id || sourcePath}-opt-${index}`,
		label: opt.text || opt.id || `Option ${index + 1}`,
		view: opt.view || "",
		action: opt.action || "",
	}));
	return {
		id: doc?.manifest?.id || sourcePath,
		title:
			doc?.manifest?.title ||
			sourcePath
				.split("/")
				.pop()
				?.replace(/\.tsl$/i, "") ||
			"Settings",
		icon: mapIcon(doc?.manifest?.icon),
		path: sourcePath,
		document: doc,
		views,
		quickLinks,
	};
}

function openDetailScreen(reverse = false) {
	if (!homeScreen || !detailScreen) return;
	homeScreen.classList.remove("entering");
	homeScreen.classList.add("leaving");
	detailScreen.classList.remove("hidden", "leaving", "reverse");
	detailScreen.classList.add("entering");
	if (reverse) detailScreen.classList.add("reverse");
	window.setTimeout(() => {
		homeScreen.classList.add("hidden");
		homeScreen.classList.remove("leaving");
		detailScreen.classList.remove("entering");
	}, 230);
}

function openHomeScreen() {
	if (!homeScreen || !detailScreen) return;
	detailScreen.classList.add("leaving", "reverse");
	homeScreen.classList.remove("hidden", "leaving");
	homeScreen.classList.add("entering");
	window.setTimeout(() => {
		detailScreen.classList.add("hidden");
		detailScreen.classList.remove("leaving", "reverse", "entering");
		homeScreen.classList.remove("entering");
	}, 230);
}

async function ensureRecentFile() {
	try {
		const raw = await window.parent.tb.fs.promises.readFile("/apps/system/settings.tapp/recent.json", "utf8");
		const parsed = JSON.parse(String(raw || "[]"));
		recentItems = Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_ITEMS) : [];
	} catch {
		recentItems = [];
		await window.parent.tb.fs.promises.writeFile("/apps/system/settings.tapp/recent.json", JSON.stringify([], null, 2), "utf8");
	}
}

async function saveRecentFile() {
	await window.parent.tb.fs.promises.writeFile("/apps/system/settings.tapp/recent.json", JSON.stringify(recentItems.slice(0, MAX_RECENT_ITEMS), null, 2), "utf8");
}

async function pushRecent(item) {
	const key = `${item.categoryId}|${item.optionId}`;
	recentItems = [item, ...recentItems.filter(it => `${it.categoryId}|${it.optionId}` !== key)].slice(0, MAX_RECENT_ITEMS);
	await saveRecentFile();
	buildRecentlyVisited();
}

function buildRecentlyVisited() {
	if (!recentlyVisitedEl) return;
	const fallback = categoryModels.slice(0, MAX_RECENT_ITEMS).map(cat => ({
		label: cat.title,
		icon: cat.icon,
		categoryId: cat.id,
		optionId: "",
		viewId: "",
	}));
	const source = recentItems.length ? recentItems : fallback;
	recentlyVisitedEl.innerHTML = source
		.map(
			item => `
<button type="button" class="recent-chip" data-open-category="${item.categoryId || ""}" data-open-view="${item.viewId || ""}" data-option-id="${item.optionId || ""}" aria-label="${item.label}">
<span class="icon-spot">${iconSet[item.icon] || iconSet.settings}</span>
<span>${item.label}</span>
</button>
`,
		)
		.join("");
}
function getTslViewScript(category, viewId) {
	const scripts = category?.document?.scripts || {};
	if (scripts[viewId]) return scripts[viewId];
	if (scripts[`${category.id}.${viewId}`]) return scripts[`${category.id}.${viewId}`];
	if (scripts[category.id]) return scripts[category.id];
	if (viewId === "storage" && scripts.storage) return scripts.storage;
	return null;
}

function executeTslViewScript(source, api) {
	const runner = new Function(
		"api",
		`"use strict";
${source}`,
	);
	return runner(api);
}

async function renderStorageViewFromTsl(category, viewId) {
	const source = getTslViewScript(category, viewId);
	if (!source) {
		return { html: `<p class="detail-control-value">Storage script is missing.</p>`, module: null };
	}
	const module = executeTslViewScript(source, {
		tb: window.parent.tb,
		window,
		document,
		sessionStorage,
		localStorage,
		navigator,
		console,
	});
	if (!module || typeof module.render !== "function") {
		return { html: `<p class="detail-control-value">Storage script is invalid.</p>`, module: null };
	}
	const html = await module.render({ category, viewId });
	return { html, module };
}

function storageLoadingMarkup() {
	return scriptLoadingMarkup("Loading storage...");
}

function scriptLoadingMarkup(text) {
	return `
<section class="storage-dashboard">
<article class="storage-main-card storage-loading-card">
<div class="storage-loading-shimmer"></div>
<div class="storage-loading-text">${text}</div>
</article>
</section>
`;
}

function buildCategoryGrid() {
	if (!categoryGridEl) return;
	categoryGridEl.innerHTML = categoryModels
		.map(
			cat => `
<article class="settings-card" data-category-open="${cat.id}">
<header class="settings-card-header">
<span class="icon-spot">${iconSet[cat.icon] || iconSet.settings}</span>
<h3 class="settings-card-title">${cat.title}</h3>
</header>
<div class="flex flex-col">
${cat.quickLinks
	.map(
		link => `
<button type="button" class="quick-link" data-open-category="${cat.id}" data-open-view="${link.view || ""}" data-option-id="${link.id}" aria-label="${link.label}">
<span class="link-icon">${iconSet.chain}</span>
<span>${link.label}</span>
</button>
`,
	)
	.join("")}
</div>
</article>
`,
		)
		.join("");
}

function bindHomeGridInteractions() {
	if (categoryGridEl && !categoryGridEl.dataset.boundHomeActions) {
		categoryGridEl.dataset.boundHomeActions = "true";
		categoryGridEl.addEventListener("click", async ev => {
			const quickBtn = ev.target instanceof HTMLElement ? ev.target.closest(".quick-link") : null;
			const card = ev.target instanceof HTMLElement ? ev.target.closest("[data-category-open]") : null;
			if (quickBtn instanceof HTMLElement) {
				ev.preventDefault();
				ev.stopPropagation();
				const categoryId = quickBtn.getAttribute("data-open-category") || "";
				const optionId = quickBtn.getAttribute("data-option-id") || "";
				const viewId = quickBtn.getAttribute("data-open-view") || "";
				if (!categoryId) return;
				await navigateToRoute({ screen: "detail", categoryId, viewId: viewId || undefined }, { push: true, reverse: false });
				const category = categoryModels.find(cat => cat.id === categoryId);
				const option = category?.quickLinks.find(it => it.id === optionId);
				if (!category || !option) return;
				await pushRecent({ categoryId, optionId, viewId: option.view || "", label: option.label, icon: category.icon });
				return;
			}

			if (card instanceof HTMLElement) {
				if (ev.target instanceof HTMLElement && ev.target.closest(".quick-link")) return;
				const categoryId = card.getAttribute("data-category-open") || "";
				if (!categoryId) return;
				await navigateToRoute({ screen: "detail", categoryId }, { push: true, reverse: false });
			}
		});
	}

	if (recentlyVisitedEl && !recentlyVisitedEl.dataset.boundHomeActions) {
		recentlyVisitedEl.dataset.boundHomeActions = "true";
		recentlyVisitedEl.addEventListener("click", async ev => {
			const chip = ev.target instanceof HTMLElement ? ev.target.closest(".recent-chip") : null;
			if (!(chip instanceof HTMLElement)) return;
			ev.preventDefault();
			ev.stopPropagation();
			const categoryId = chip.getAttribute("data-open-category") || "";
			const viewId = chip.getAttribute("data-open-view") || "";
			if (!categoryId) return;
			await navigateToRoute({ screen: "detail", categoryId, viewId: viewId || undefined }, { push: true, reverse: true });
		});
	}
}

function getCategoryById(categoryId) {
	return categoryModels.find(cat => cat.id === categoryId) || null;
}

function selectViewInSidebar(viewId) {
	if (!detailSidebarEl) return;
	detailSidebarEl.querySelectorAll(".detail-nav-btn").forEach(btn => {
		const on = btn.getAttribute("data-view-id") === viewId;
		btn.classList.toggle("active", on);
	});
}

function parseCategoryContext(category) {
	const title = String(category.title || "").toLowerCase();
	if (title.includes("internet")) return "internet";
	if (title.includes("account")) return "account";
	if (title.includes("appearance")) return "appearance";
	if (title.includes("general")) return "general";
	if (title.includes("apps")) return "apps";
	return "generic";
}

function updateDetailTitle() {
	if (!detailTitleEl) return;
	if (currentSearchTerm) {
		detailTitleEl.textContent = `Searching for: ${currentSearchTerm}`;
		return;
	}
	detailTitleEl.textContent = currentCategory?.title || "Settings";
}

function scoreTextMatch(textValue, searchTerm) {
	const text = String(textValue || "").toLowerCase();
	const term = String(searchTerm || "").toLowerCase();
	if (!text || !term) return 0;
	if (text === term) return 120;
	if (text.startsWith(term)) return 90;
	if (text.includes(term)) return 65;
	return 0;
}

function findBestMatches(searchTerm) {
	const term = String(searchTerm || "")
		.trim()
		.toLowerCase();
	if (!term) return [];

	const hits = [];
	for (const category of categoryModels) {
		for (const quick of category.quickLinks) {
			const quickScore = scoreTextMatch(quick.label, term);
			const viewScore = scoreTextMatch(quick.view, term);
			const catScore = scoreTextMatch(category.title, term);
			const score = quickScore + Math.floor(viewScore / 3) + Math.floor(catScore / 3);
			if (!score) continue;
			hits.push({
				score,
				kind: "Recommended",
				label: quick.label || quick.id || "Setting",
				categoryId: category.id,
				categoryTitle: category.title,
				viewId: quick.view || category.views[0]?.id || "",
				icon: category.icon,
			});
		}

		for (const view of category.views) {
			const viewTitle = view.title || view.id || "";
			const viewScore = scoreTextMatch(viewTitle, term);
			let sectionBoost = 0;
			for (const section of view.sections || []) {
				sectionBoost = Math.max(sectionBoost, Math.floor(scoreTextMatch(section.title, term) / 2));
				for (const control of section.controls || []) {
					sectionBoost = Math.max(sectionBoost, Math.floor(scoreTextMatch(control.label, term) / 2));
				}
			}
			const catScore = Math.floor(scoreTextMatch(category.title, term) / 3);
			const score = viewScore + sectionBoost + catScore;
			if (!score) continue;
			hits.push({
				score,
				kind: "View",
				label: viewTitle,
				categoryId: category.id,
				categoryTitle: category.title,
				viewId: view.id || category.views[0]?.id || "",
				icon: category.icon,
			});
		}
	}

	return hits
		.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
		.filter((hit, index, arr) => arr.findIndex(other => other.categoryId === hit.categoryId && other.viewId === hit.viewId && other.label === hit.label) === index)
		.slice(0, 12);
}

async function openSearchResults(searchTerm, reverse = false, shouldPushHistory = true) {
	const normalized = String(searchTerm || "").trim();
	if (!normalized) {
		currentSearchTerm = "";
		return;
	}
	currentCategory = null;
	currentViewId = "";
	currentSearchTerm = normalized;
	updateDetailTitle();

	const matches = findBestMatches(normalized);
	if (detailSidebarEl) {
		detailSidebarEl.innerHTML = `
<div class="search-side-panel">
<div class="search-side-label">Best Matches</div>
<div class="search-side-count">${matches.length} result${matches.length === 1 ? "" : "s"}</div>
</div>
`;
	}

	if (detailContentEl) {
		if (!matches.length) {
			detailContentEl.innerHTML = `<p class="detail-control-value">No settings matched "${normalized}".</p>`;
		} else {
			detailContentEl.innerHTML = matches
				.map(
					match => `
<button type="button" class="search-result-card" data-open-category="${match.categoryId}" data-open-view="${match.viewId}">
<span class="search-result-icon">${iconSet[match.icon] || iconSet.settings}</span>
<span class="search-result-body">
<span class="search-result-title">${match.label}</span>
<span class="search-result-meta">${match.kind} in ${match.categoryTitle}</span>
</span>
</button>
`,
				)
				.join("");

			detailContentEl.querySelectorAll("[data-open-category]").forEach(btn => {
				btn.addEventListener("click", async () => {
					const categoryId = btn.getAttribute("data-open-category") || "";
					const viewId = btn.getAttribute("data-open-view") || "";
					if (!categoryId) return;
					await navigateToRoute({ screen: "detail", categoryId, viewId }, { push: true, reverse: false });
				});
			});
		}
	}

	openDetailScreen(reverse);
	if (shouldPushHistory) pushRoute(currentRoute());
}

async function loadWispServers() {
	try {
		const raw = await window.parent.tb.fs.promises.readFile("/apps/system/settings.tapp/wisp-servers.json", "utf8");
		const data = JSON.parse(String(raw || "[]"));
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

async function saveWispServers(list) {
	await window.parent.tb.fs.promises.writeFile("/apps/system/settings.tapp/wisp-servers.json", JSON.stringify(list, null, 2), "utf8");
}

function renderGenericView(view) {
	const sections = Array.isArray(view?.sections) ? view.sections : [];
	if (!sections.length) return `<p class="detail-control-value">No controls for this view yet.</p>`;
	return sections
		.map(section => {
			const controls = Array.isArray(section.controls) ? section.controls : [];
			const controlHtml = controls
				.map(control => {
					const ctype = String(control.type || "").toLowerCase();
					if (ctype === "button") {
						const actionId = String(control.action || "");
						const disabledAttr = actionId ? "" : " disabled";
						const actionAttr = actionId ? ` data-action-id="${actionId}"` : "";
						return `<button type="button" class="detail-action"${actionAttr}${disabledAttr}>${control.label || "Run Action"}</button>`;
					}
					if (ctype === "toggle") {
						const bind = String(control.bind || "");
						const bindAttr = bind ? ` data-bind-key="${bind}"` : "";
						return `<label><div class="detail-control-text">${control.label || "Toggle"}</div><input type="checkbox" class="detail-input"${bindAttr}></label>`;
					}
					if (ctype === "select") {
						const bind = String(control.bind || "");
						const bindAttr = bind ? ` data-bind-key="${bind}"` : "";
						const options = String(control.attributes?.options || "")
							.split(",")
							.map(opt => opt.trim())
							.filter(Boolean)
							.map(opt => `<option value="${opt}">${opt}</option>`)
							.join("");
						return `<label><div class="detail-control-text">${control.label || "Select"}</div><select class="detail-input"${bindAttr}>${options}</select></label>`;
					}
					if (ctype === "slider") {
						const bind = String(control.bind || "");
						const bindAttr = bind ? ` data-bind-key="${bind}"` : "";
						const min = Number(control.attributes?.min ?? 0);
						const max = Number(control.attributes?.max ?? 100);
						const step = Number(control.attributes?.step ?? 1);
						return `<label><div class="detail-control-text">${control.label || "Slider"}</div><input type="range" class="detail-input" min="${min}" max="${max}" step="${step}" value="${min}"${bindAttr}></label>`;
					}
					if (ctype === "text") {
						const bind = String(control.bind || "");
						if (!bind) return `<div><div class="detail-control-text">${control.label || "Text"}</div><div class="detail-control-value">No binding</div></div>`;
						return `<label><div class="detail-control-text">${control.label || "Text"}</div><input type="text" class="detail-input" data-bind-key="${bind}"></label>`;
					}
					if (ctype === "list") {
						const bind = String(control.bind || "");
						if (!bind) return `<div><div class="detail-control-text">${control.label || "List"}</div><div class="detail-control-value">No binding</div></div>`;
						return `<label><div class="detail-control-text">${control.label || "List"}</div><input type="text" class="detail-input" placeholder="Comma separated values" data-bind-key="${bind}"></label>`;
					}
					return `<div><div class="detail-control-text">${control.label || control.type}</div></div>`;
				})
				.join("");
			return `<section><h3 class="detail-section-title">${section.title || "Section"}</h3><div class="flex flex-col gap-3">${controlHtml}</div></section>`;
		})
		.join("");
}

function collectGenericBindings(rootEl) {
	const bindings = {};
	if (!rootEl) return bindings;
	rootEl.querySelectorAll("[data-bind-key]").forEach(el => {
		const key = String(el.getAttribute("data-bind-key") || "").trim();
		if (!key) return;
		if (el instanceof HTMLInputElement) {
			if (el.type === "checkbox") {
				bindings[key] = !!el.checked;
				return;
			}
			if (el.type === "range") {
				bindings[key] = Number(el.value);
				return;
			}
			const value = String(el.value || "").trim();
			bindings[key] = value;
			return;
		}
		if (el instanceof HTMLSelectElement) {
			bindings[key] = el.value;
			return;
		}
	});
	return bindings;
}

async function executeGenericAction(category, view, actionId) {
	if (!parser || typeof parser.executeAction !== "function") {
		console.warn("TSLParser.executeAction unavailable");
		return;
	}
	if (!category?.document || !actionId) return;
	const bindings = collectGenericBindings(detailContentEl);
	await parser.executeAction(category.document, actionId, {
		category,
		viewId: view?.id || "",
		bindings,
	});
}

function wireGenericActions(category, view) {
	if (!detailContentEl) return;
	detailContentEl.querySelectorAll("[data-action-id]").forEach(btn => {
		btn.addEventListener("click", async () => {
			const actionId = String(btn.getAttribute("data-action-id") || "").trim();
			if (!actionId) return;
			try {
				await executeGenericAction(category, view, actionId);
				await renderDetailContent(category, view.id || "");
			} catch (error) {
				console.error(`Failed to execute TSL action '${actionId}'`, error);
			}
		});
	});
}

function serverStatusFromLatency(latency) {
	if (latency === null || typeof latency === "undefined") return { online: false, label: "999ms" };
	if (latency > 800) return { online: false, label: `${latency}ms` };
	return { online: true, label: `${latency}ms` };
}

async function measureWsLatency(url) {
	return new Promise(resolve => {
		try {
			const ws = new WebSocket(url);
			const started = Date.now();
			const finish = val => {
				try {
					ws.close();
				} catch {
					/* ignore */
				}
				resolve(val);
			};
			const timer = window.setTimeout(() => finish(null), 1800);
			ws.addEventListener("open", () => {
				window.clearTimeout(timer);
				finish(Date.now() - started);
			});
			ws.addEventListener("error", () => {
				window.clearTimeout(timer);
				finish(null);
			});
		} catch {
			resolve(null);
		}
	});
}

async function renderInternetWispView() {
	const list = await loadWispServers();
	const rows = await Promise.all(
		list.map(async item => {
			const latency = await measureWsLatency(item.id);
			const state = serverStatusFromLatency(latency);
			const name = item.name || "Server Name";
			const address = item.id || "wss://example.com/wisp";
			return `
<div class="server-card-wrap">
<div class="server-card ${state.online ? "is-online" : "is-offline"}">
<span class="server-icon">${iconSet.wifi}</span>
<div>
<div class="server-main-title">${name}</div>
<div class="server-latency">${state.label}</div>
<div class="server-subtext">${address}</div>
</div>
</div>
<button type="button" class="server-delete" data-del-wisp="${name}">${iconSet.trash}</button>
</div>
`;
		}),
	);
	return `${rows.join("")}<button type="button" class="detail-action" data-add-wisp="true"><span class="link-icon">${iconSet.settings}</span><span>Add Wisp Server</span></button>`;
}

async function renderDetailContent(category, viewId) {
	if (!detailContentEl) return;
	const view = category.views.find(v => v.id === viewId) || category.views[0];
	if (!view) {
		detailContentEl.innerHTML = `<p class="detail-control-value">No view available.</p>`;
		return;
	}
	const viewKey = String(view.id || "");
	const scriptSource = getTslViewScript(category, viewKey);
	if (scriptSource) {
		detailContentEl.innerHTML = scriptLoadingMarkup(`Loading ${view.title || viewKey || "settings"}...`);
		const scriptedView = await renderStorageViewFromTsl(category, viewKey || "");
		detailContentEl.innerHTML = scriptedView.html;
		if (scriptedView.module && typeof scriptedView.module.wire === "function") {
			scriptedView.module.wire(detailContentEl, { category, viewId: viewKey });
		}
		return;
	}
	const context = parseCategoryContext(category);
	if (context === "internet" && String(view.id || "") === "wisp") {
		detailContentEl.innerHTML = await renderInternetWispView();
		wireWispActions(category, view);
		return;
	}
	detailContentEl.innerHTML = renderGenericView(view);
	wireGenericActions(category, view);
}

function wireWispActions(category, view) {
	if (!detailContentEl) return;
	detailContentEl.querySelectorAll("[data-del-wisp]").forEach(btn => {
		btn.addEventListener("click", async () => {
			const target = btn.getAttribute("data-del-wisp") || "";
			if (!target) return;
			const list = await loadWispServers();
			const next = list.filter(item => item.name !== target);
			await saveWispServers(next);
			await renderDetailContent(category, view.id || "");
		});
	});

	const addBtn = detailContentEl.querySelector("[data-add-wisp='true']");
	if (addBtn) {
		addBtn.addEventListener("click", async () => {
			if (!window.tb?.dialog?.Message) return;
			const name = await new Promise(resolve => window.tb.dialog.Message({ title: "Enter Wisp server name", onOk: value => resolve(value) }));
			if (!name) return;
			const addr = await new Promise(resolve => window.tb.dialog.Message({ title: "Enter Wisp socket URL", onOk: value => resolve(value) }));
			if (!addr) return;
			const list = await loadWispServers();
			list.push({ id: String(addr), name: String(name) });
			await saveWispServers(list);
			await renderDetailContent(category, view.id || "");
		});
	}
}

function renderDetailSidebar(category, activeViewId) {
	if (!detailSidebarEl) return;
	detailSidebarEl.innerHTML = category.views
		.map(
			view => `
<button type="button" class="detail-nav-btn ${view.id === activeViewId ? "active" : ""}" data-view-id="${view.id}">${view.title || view.id}</button>
`,
		)
		.join("");

	detailSidebarEl.querySelectorAll(".detail-nav-btn").forEach(btn => {
		btn.addEventListener("click", async () => {
			const viewId = btn.getAttribute("data-view-id") || "";
			if (!viewId || !currentCategory) return;
			currentViewId = viewId;
			selectViewInSidebar(viewId);
			await renderDetailContent(currentCategory, viewId);
			pushRoute(currentRoute());
		});
	});
}

async function openCategoryDetail(categoryId, preferredViewId, reverse = false, shouldPushHistory = true) {
	const category = getCategoryById(categoryId);
	if (!category) return;
	const selectedView = category.views.find(v => v.id === preferredViewId) ? preferredViewId : category.views[0]?.id || "";
	if (!selectedView) return;
	currentCategory = category;
	currentViewId = selectedView;
	currentSearchTerm = "";
	updateDetailTitle();
	renderDetailSidebar(category, selectedView);
	await renderDetailContent(category, selectedView);
	openDetailScreen(reverse);
	if (shouldPushHistory) pushRoute(currentRoute());
	await pushRecent({ categoryId: category.id, optionId: "", viewId: selectedView, label: category.title, icon: category.icon });
}

async function loadTslCategories() {
	if (!parser || typeof parser.parseTSL !== "function") throw new Error("window.tb.system.TSLParser unavailable");
	const entries = await window.parent.tb.fs.promises.readdir("/apps/system/settings.tapp");
	const tslFiles = entries.filter(name => typeof name === "string" && name.toLowerCase().endsWith(".tsl") && name.toLowerCase() !== "recent.json").sort();
	const docs = await Promise.all(
		tslFiles.map(async file => {
			const fullPath = `/apps/system/settings.tapp/${file}`;
			const doc = await parser.parseTSL(fullPath);
			return normalizeCategoryFromDoc(doc, fullPath);
		}),
	);
	categoryModels = docs.filter(cat => cat.quickLinks.length > 0 && cat.views.length > 0).sort(orderCategory);
}

async function init() {
	try {
		await loadTslCategories();
		await ensureRecentFile();
		buildRecentlyVisited();
		buildCategoryGrid();
		bindHomeGridInteractions();
		pushRoute({ screen: "home" });
		bindTitlebarNav();
		window.setTimeout(bindTitlebarNav, 250);
		window.setTimeout(bindTitlebarNav, 1000);
	} catch (err) {
		console.error("Failed to initialize settings UI", err);
	}
}

init();
