import { View, Button,Input ,Image,Canvas} from '@tarojs/components'
import Taro,{ useLoad } from '@tarojs/taro'
import { useState,useRef,useEffect } from 'react'
import './index.less'

export default function Index () {
  useLoad(() => {
    console.log('Page loaded.');
  });

 const [imagePath, setImagePath] = useState(''); 
 const [imageSize, setImageSize] = useState({ width: 300, height: 200 }); 
 const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 }); 
 const [text, setText] = useState(''); 
 const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); 
 const [isDragging, setIsDragging] = useState(false); 
 const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 }); 
 const canvasRef = useRef(null); 

 useEffect(() => {
   const query = Taro.createSelectorQuery();
   query
     .select("#canvas")
     .boundingClientRect((rect) => {
       if (rect) {
         const canvasRect = Array.isArray(rect) ? rect[0] : rect;
         setCanvasOffset({ x: canvasRect.left, y: canvasRect.top });
       }
     })
     .exec();
 }, []);

 const handleChooseImage = async () => {
   try {
     const res = await Taro.chooseImage({
       count: 1, // 选择一张图片
       sourceType: ['album', 'camera'], // 可以从相册或相机选择
     });

     if (res.tempFilePaths.length > 0) {
       const path = res.tempFilePaths[0];
       setImagePath(path); 

       const imageInfo = await Taro.getImageInfo({ src: path });
       const originalWidth = imageInfo.width;
       const originalHeight = imageInfo.height;

       const scaledWidth = originalWidth / 2;
       const scaledHeight = originalHeight / 2;

       setImageSize({ width: originalWidth, height: originalHeight });
       setCanvasSize({ width: scaledWidth, height: scaledHeight });

       drawImageWithText(path, text, textPosition, scaledWidth, scaledHeight);
     }
   } catch (error) {
     console.error('选择图片失败', error);
     Taro.showToast({ title: '选择图片失败', icon: 'none' });
   }
 };

 const handleAddText = () => {
   if (!text) return;
   drawImageWithText(
     imagePath,
     text,
     textPosition,
     canvasSize.width,
     canvasSize.height
   ); 
 };

 const drawImageWithText = (imagePath1, text1, position1, width1, height1) => {
   const ctx = Taro.createCanvasContext('canvas', this);
   if (!ctx) {
     console.error('Canvas 上下文获取失败');
     return;
   }

   ctx.clearRect(0, 0, width1, height1);

   if (imagePath) {
     ctx.drawImage(imagePath, 0, 0, width1, height1);
   }

   ctx.setFontSize(20); 
   ctx.fillStyle = '#000000';
   ctx.fillText(text1, position1.x, position1.y); 
   ctx.draw();
 };

 // 开始拖拽文字
 const handleTouchStart = (e) => {
   const { x, y } = textPosition;
   const { touches } = e;
   const { clientX, clientY } = touches[0];
   const canvasX = clientX - canvasOffset.x;
   const canvasY = clientY - canvasOffset.y;
   if (
     canvasX >= x &&
     canvasX <= x + 100 &&
     canvasY >= y - 20 &&
     canvasY <= y
   ) {
     setIsDragging(true);
   }
 };

 const handleTouchMove = (e) => {
   if (!isDragging) return;

   const { touches } = e;
   const { clientX, clientY } = touches[0];

   const canvasX = clientX - canvasOffset.x;
   const canvasY = clientY - canvasOffset.y;

   setTextPosition({ x: canvasX, y: canvasY });

   drawImageWithText(
     imagePath,
     text,
     { x: canvasX, y: canvasY },
     canvasSize.width,
     canvasSize.height
   );
 };

 const handleTouchEnd = () => {
   setIsDragging(false);
 };

 const handleSaveImage = () => {
   Taro.canvasToTempFilePath({
     canvasId: 'canvas',
     success: (res) => {
       const tempFilePath = res.tempFilePath;
       Taro.saveImageToPhotosAlbum({
         filePath: tempFilePath,
         success: () => {
           Taro.showToast({ title: '保存成功', icon: 'success' });
         },
         fail: () => {
           Taro.showToast({ title: '保存失败', icon: 'none' });
         },
       });
     },
     fail: () => {
       Taro.showToast({ title: '生成图片失败', icon: 'none' });
     },
   });
 };

 return (
   <View className='index'>
     <Button onClick={handleChooseImage}>上传图片</Button>
     <Input
       placeholder='输入文字'
       value={text}
       onInput={(e) => setText(e.detail.value)}
     />
     <Button onClick={handleAddText}>添加文字</Button>
     <Canvas
       id='canvas'
       ref={canvasRef}
       canvasId='canvas'
       style={{
         width: `${canvasSize.width}px`,
         height: `${canvasSize.height}px`,
         border: '1px solid #000',
       }}
       onTouchStart={handleTouchStart}
       onTouchMove={handleTouchMove}
       onTouchEnd={handleTouchEnd}
     />
     <Button onClick={handleSaveImage}>保存图片</Button>
   </View>
 );
}
