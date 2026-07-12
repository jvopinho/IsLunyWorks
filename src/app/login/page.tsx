'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loginSchema, LoginInput } from '@/validations/auth';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { LogIn } from 'lucide-react';
import { Container, CardWrapper, Title, Subtitle, Form, InputGroup, ErrorBanner } from './styles';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (response?.error) {
        setError(response.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <CardWrapper>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <Logo size="lg" />
          <span style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center', fontWeight: 500 }}>
            Plataforma de Gestão Interna da IsLuny Org
          </span>
        </div>
        
        {error && <ErrorBanner>{error}</ErrorBanner>}
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <InputGroup>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...register('email')}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </InputGroup>

          <InputGroup>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </InputGroup>

          <Button type="submit" variant="primary" fullWidth size="lg" isLoading={isLoading}>
            Entrar no sistema <LogIn size={18} style={{ marginLeft: '6px' }} />
          </Button>
        </Form>
      </CardWrapper>
    </Container>
  );
}
