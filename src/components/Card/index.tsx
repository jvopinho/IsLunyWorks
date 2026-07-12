import React from 'react';
import { StyledCard, CardHeader, CardTitle, CardDescription, CardContent } from './styles';

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  extra,
  ...props
}) => {
  return (
    <StyledCard {...props}>
      {(title || description || extra) && (
        <CardHeader>
          <div>
            {title && typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
            {description && typeof description === 'string' ? (
              <CardDescription>{description}</CardDescription>
            ) : (
              description
            )}
          </div>
          {extra && <div>{extra}</div>}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
    </StyledCard>
  );
};
