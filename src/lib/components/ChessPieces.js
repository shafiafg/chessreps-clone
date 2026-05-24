import React from 'react';

const baseProps = { width: 48, height: 48, viewBox: '0 0 45 45', xmlns: 'http://www.w3.org/2000/svg' };

export function WhitePawn({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="none" fillRule="evenodd">
        <circle cx="22.5" cy="11" r="4.5" fill="#ffffff" stroke="#000" strokeWidth="0.8" />
        <path d="M11 34c3-5 8-7 11-7s8 2 11 7" fill="#ffffff" stroke="#000" strokeWidth="0.8"/>
        <rect x="9" y="21" width="27" height="4" rx="2" fill="#ffffff" stroke="#000" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

export function BlackPawn({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="none" fillRule="evenodd">
        <circle cx="22.5" cy="11" r="4.5" fill="#111827" stroke="#fff" strokeWidth="0.7" />
        <path d="M11 34c3-5 8-7 11-7s8 2 11 7" fill="#111827" stroke="#fff" strokeWidth="0.7"/>
        <rect x="9" y="21" width="27" height="4" rx="2" fill="#111827" stroke="#fff" strokeWidth="0.7" />
      </g>
    </svg>
  );
}

export function WhiteKnight({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#fff" stroke="#000" strokeWidth="0.8">
        <path d="M12 34c5-6 10-6 15-4 1-4 0-8-3-10-4-2-6-1-9 0-2 1-4 3-3 6 1 3 0 6 0 8z"/>
        <circle cx="20" cy="15" r="1.8" fill="#000" />
      </g>
    </svg>
  );
}

export function BlackKnight({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#0b0b0b" stroke="#fff" strokeWidth="0.7">
        <path d="M12 34c5-6 10-6 15-4 1-4 0-8-3-10-4-2-6-1-9 0-2 1-4 3-3 6 1 3 0 6 0 8z"/>
        <circle cx="20" cy="15" r="1.6" fill="#fff" />
      </g>
    </svg>
  );
}

export function WhiteBishop({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#fff" stroke="#000" strokeWidth="0.8">
        <path d="M22 10c2 3 4 4 4 8-6 1-12 1-18 0 0-4 6-6 14-8z"/>
        <path d="M14 26c3-2 11-2 14 0v6H14v-6z"/>
      </g>
    </svg>
  );
}

export function BlackBishop({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#0b0b0b" stroke="#fff" strokeWidth="0.7">
        <path d="M22 10c2 3 4 4 4 8-6 1-12 1-18 0 0-4 6-6 14-8z"/>
        <path d="M14 26c3-2 11-2 14 0v6H14v-6z"/>
      </g>
    </svg>
  );
}

export function WhiteRook({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#fff" stroke="#000" strokeWidth="0.8">
        <rect x="11" y="14" width="23" height="16" rx="2" />
        <rect x="9" y="10" width="27" height="4" />
      </g>
    </svg>
  );
}

export function BlackRook({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#0b0b0b" stroke="#fff" strokeWidth="0.7">
        <rect x="11" y="14" width="23" height="16" rx="2" />
        <rect x="9" y="10" width="27" height="4" />
      </g>
    </svg>
  );
}

export function WhiteQueen({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#fff" stroke="#000" strokeWidth="0.8">
        <circle cx="10" cy="10" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="35" cy="10" r="2" />
        <path d="M11 20c5-6 21-6 26 0v14H11V20z"/>
      </g>
    </svg>
  );
}

export function BlackQueen({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#0b0b0b" stroke="#fff" strokeWidth="0.7">
        <circle cx="10" cy="10" r="2" />
        <circle cx="22.5" cy="8" r="2" />
        <circle cx="35" cy="10" r="2" />
        <path d="M11 20c5-6 21-6 26 0v14H11V20z"/>
      </g>
    </svg>
  );
}

export function WhiteKing({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#fff" stroke="#000" strokeWidth="0.8">
        <rect x="20" y="6" width="5" height="10" rx="1" />
        <path d="M11 24c5-8 20-8 26 0v12H11V24z"/>
      </g>
    </svg>
  );
}

export function BlackKing({ className }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      <g fill="#0b0b0b" stroke="#fff" strokeWidth="0.7">
        <rect x="20" y="6" width="5" height="10" rx="1" />
        <path d="M11 24c5-8 20-8 26 0v12H11V24z"/>
      </g>
    </svg>
  );
}

const Pieces = {
  wP: WhitePawn, bP: BlackPawn,
  wN: WhiteKnight, bN: BlackKnight,
  wB: WhiteBishop, bB: BlackBishop,
  wR: WhiteRook, bR: BlackRook,
  wQ: WhiteQueen, bQ: BlackQueen,
  wK: WhiteKing, bK: BlackKing
};

export default Pieces;
