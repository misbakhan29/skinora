import React from 'react';

/**
 * SkinoraLogo - Custom image logo with transparent background.
 */
export default function SkinoraLogo({ size = 24, className = '', style = {} }) {
  return (
    <img
      src="/logo.svg"
      alt="Skinora Logo"
      style={{ height: size, width: 'auto', objectFit: 'contain', ...style }}
      className={className}
    />
  );
}
