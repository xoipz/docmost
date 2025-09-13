import { rem } from "@mantine/core";

interface Props {
  size?: number | string;
}

function IconMapNavigator({ size }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      style={{ width: rem(size), height: rem(size) }}
    >
      <path 
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H5C3.89543 17 3 16.1046 3 15V5Z" 
        stroke="currentColor" 
        strokeWidth="1.5"
        fill="none"
      />
      <path 
        d="M6 8H9M6 11H12M15 8H18M15 11H16" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      <rect 
        x="4" 
        y="6" 
        width="6" 
        height="4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        opacity="0.3"
      />
      <path 
        d="M7 19V21M17 19V21M7 21H17" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
    </svg>
  );
}

export default IconMapNavigator;