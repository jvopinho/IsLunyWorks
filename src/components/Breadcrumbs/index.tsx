import React from 'react';
import Link from 'next/link';
import { BreadcrumbsContainer, BreadcrumbItem, Separator } from './styles';

export interface BreadcrumbLink {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbLink[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <BreadcrumbsContainer aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <BreadcrumbItem active={isLast}>
              {item.href && !isLast ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <Separator>/</Separator>}
          </React.Fragment>
        );
      })}
    </BreadcrumbsContainer>
  );
};
