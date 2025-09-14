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
      {/* 指南针外圈 */}
      <circle 
        cx="12" 
        cy="12" 
        r="9" 
        stroke="currentColor" 
        strokeWidth="1.5"
        fill="none"
      />
      {/* 指南针指针 - 北针 */}
      <path 
        d="M12 3 L15 12 L12 9 L9 12 Z" 
        fill="currentColor"
        opacity="0.8"
      />
      {/* 指南针指针 - 南针 */}
      <path 
        d="M12 21 L9 12 L12 15 L15 12 Z" 
        fill="currentColor"
        opacity="0.4"
      />
      {/* 中心点 */}
      <circle 
        cx="12" 
        cy="12" 
        r="1.5" 
        fill="currentColor"
      />
      {/* 方向标记 N */}
      <text 
        x="12" 
        y="6" 
        textAnchor="middle" 
        fontSize="6" 
        fill="currentColor"
        fontWeight="bold"
      >
        N
      </text>
    </svg>
  );
}

export default IconMapNavigator;