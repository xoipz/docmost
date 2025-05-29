import { rem } from '@mantine/core';

interface Props {
  size?: number | string;
}

export function BilibiliIcon({ size }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: rem(size), height: rem(size) }}
    >
      <path
        d="M4.66669 4V18.6667H19.3334V4H4.66669Z"
        stroke="#00A1D6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.0002 8.66669V14.0001L14.0002 11.3334L10.0002 8.66669Z"
        fill="#00A1D6"
      />
    </svg>
  );
} 