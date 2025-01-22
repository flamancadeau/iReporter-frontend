import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ children,onClick, className, type = 'button' }) => {
  return (
    <button className={`${className} bg-black text-teal-50 p-4 rounded-lg` }  type={type} onClick={onClick }>
      {children}
    </button>
  );
};

export default Button;
