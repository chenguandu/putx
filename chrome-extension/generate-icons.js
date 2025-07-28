const fs = require('fs');
const path = require('path');

// Canvas库用于生成图像
const { createCanvas } = require('canvas');

// 创建不同尺寸的图标
const sizes = [16, 24, 32, 48, 128];

// 为每个尺寸创建图标
sizes.forEach(size => {
  // 创建画布
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // 绘制黑色背景
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // 绘制白色"P"字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.floor(size * 0.75)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', size/2, size/2);
  
  // 保存为PNG文件
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(__dirname, 'assets', 'icons', `icon${size}.png`);
  fs.writeFileSync(filename, buffer);
  
  console.log(`已创建 ${size}x${size} 图标: ${filename}`);
});

console.log('所有图标已生成完成！');