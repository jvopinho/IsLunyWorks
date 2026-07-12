import React from 'react';
import Image from 'next/image';
import * as S from './styles';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ collapsed = false, size = 'md' }) => {
  return (
    <S.LogoContainer collapsed={collapsed} size={size}>
      <S.LogoImageWrapper size={size}>
        <Image
          src="/logo.svg"
          alt="IsLuny Org Logo"
          width={size === 'lg' ? 48 : size === 'md' ? 36 : 28}
          height={size === 'lg' ? 48 : size === 'md' ? 36 : 28}
          priority
        />
      </S.LogoImageWrapper>
      {!collapsed && (
        <S.LogoTextWrapper size={size}>
          <S.LogoTitle size={size}>IsLuny Works</S.LogoTitle>
          <S.LogoSubtitle size={size}>IsLuny Org</S.LogoSubtitle>
        </S.LogoTextWrapper>
      )}
    </S.LogoContainer>
  );
};
