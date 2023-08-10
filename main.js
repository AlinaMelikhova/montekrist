'use strict';

const BET = 10000;

const BALANCE_STORAGE_KEY = 'balance';
const BALANCE_DEFAULT_VALUE = 1_000_000;

const STARS_BET = 100;
const STARS_STORAGE_KEY = 'stars';
const STARS_DEFAULT_VALUE = 0;

const starsCurrent = document.querySelector(
  '.page-header__item-value--star-current'
);
const balance = document.querySelector('.page-header__item-value--coin');
const minButton = document.querySelector('.footer__bet-btn--min');
const maxButton = document.querySelector('.footer__bet-btn--max');
const betAmount = document.querySelector('.footer__bet-amount-number');
const winAmount = document.querySelector('.footer__win-amount');
const autoButton = document.querySelector('.footer__controls-btn--auto');
const spinButton = document.querySelector('.footer__controls-btn--spin');

let betAmountNumber = Number(betAmount.textContent);
let winAmoun = winAmount.textContent;
let betAmountStorage;
let isAutoModeOn;
let autoModeTaskId;

const debugEl = document.getElementById('debug'),
  icon_width = 105,
  icon_height = 81,
  num_icons = 9,
  time_per_icon = 100,
  indexes = [0, 0, 0];

/**
 * Roll one reel
 */
const roll = (reel, offset = 0) => {
  const delta =
    (offset + 2) * num_icons + Math.round(Math.random() * num_icons);

  return new Promise((resolve, reject) => {
    const style = getComputedStyle(reel),
      backgroundPositionY = parseFloat(style['background-position-y']),
      targetBackgroundPositionY = backgroundPositionY + delta * icon_height,
      normTargetBackgroundPositionY =
        targetBackgroundPositionY % (num_icons * icon_height);

    setTimeout(() => {
      reel.style.transition = `background-position-y ${
        (8 + 1 * delta) * time_per_icon
      }ms cubic-bezier(.41,-0.01,.63,1.09)`;
      reel.style.backgroundPositionY = `${
        backgroundPositionY + delta * icon_height
      }px`;
    }, offset * 150);

    setTimeout(() => {
      reel.style.transition = `none`;
      reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
      resolve(delta % num_icons);
    }, (8 + 1 * delta) * time_per_icon + offset * 150);
  });
};

/**
 * Roll all reels, when promise resolves roll again
 */
function rollAll() {
  const reelsList = document.querySelectorAll('.slots > .reel');

  return Promise.all([...reelsList].map((reel, i) => roll(reel, i))).then(
    (deltas) => {
      deltas.forEach(
        (delta, i) => (indexes[i] = (indexes[i] + delta) % num_icons)
      );

      // Win conditions
      if (indexes[0] == indexes[1] && indexes[1] == indexes[2]) {
        if (isNaN(betAmountStorage)) {
          betAmountStorage = 0;
        }
        const winCls = 'win1';
        winAmount.textContent = betAmountStorage * 5;

        document.querySelector('.slots').classList.add(winCls);
        setTimeout(() => {
          document.querySelector('.slots').classList.remove(winCls);
          updateBalance(Number(balance.textContent) + betAmountStorage * 5);
          winAmount.textContent = '';
        }, 2000);
      }
    }
  );
}

function updateBalance(value) {
  balance.textContent = value;
  if (typeof sessionStorage.setItem === 'function') {
    sessionStorage.setItem(BALANCE_STORAGE_KEY, value);
  }
}

function updateStars(value) {
  starsCurrent.textContent = value;
  if (typeof sessionStorage.setItem === 'function') {
    sessionStorage.setItem(STARS_STORAGE_KEY, value);
  }
}

function initValueFromStorage(storageKey, defaultValue, cb) {
  let balanceValue;
  const storedValue = sessionStorage.getItem(storageKey);
  if (storedValue) {
    balanceValue = storedValue === '0' ? 0 : Number(storedValue);
  } else {
    balanceValue = defaultValue;
  }
  cb(balanceValue);
}

minButton.addEventListener('click', () => {
  if (betAmountNumber == balance.textContent) {
    maxButton.disabled = false;
  }
  if (betAmountNumber === 0) {
    minButton.disabled = true;
    return;
  }
  if (betAmountNumber === BET) {
    spinButton.disabled = true;
    minButton.disabled = true;
  }
  betAmountNumber -= BET;
  betAmount.textContent = betAmountNumber;
});

maxButton.addEventListener('click', () => {
  if (betAmountNumber == balance.textContent) {
    maxButton.disabled = true;
    return;
  }
  if (betAmountNumber == Number(balance.textContent) - BET) {
    maxButton.disabled = true;
  }
  betAmountNumber += BET;
  betAmount.textContent = betAmountNumber;
  minButton.disabled = false;
  spinButton.disabled = false;
});

spinButton.addEventListener('click', () => {
  betAmountStorage = betAmountNumber;
  balance.textContent = Number(balance.textContent) - betAmountNumber;
  betAmountNumber = 0;
  betAmount.textContent = 0;
  updateStars(Number(starsCurrent.textContent) + STARS_BET);
  spinButton.disabled = true;
  minButton.disabled = true;
  rollAll();
});

autoButton.addEventListener('click', () => {
  const runInfinite = () => {
    rollAll().then(() => {
      if (isAutoModeOn) {
        autoModeTaskId = setTimeout(runInfinite, 2000);
      }
    });
  };
  autoButton.classList.toggle('stop');
  if (autoButton.classList.contains('stop')) {
    isAutoModeOn = false;
    clearTimeout(autoModeTaskId);
    return;
  }

  isAutoModeOn = true;
  runInfinite();
});

initValueFromStorage(STARS_STORAGE_KEY, STARS_DEFAULT_VALUE, (value) =>
  updateStars(value)
);

initValueFromStorage(BALANCE_STORAGE_KEY, BALANCE_DEFAULT_VALUE, (value) =>
  updateBalance(value)
);
