import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
  ActionIcon,
  Card,
  Image,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import { useState, useEffect, useRef } from "react";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { svgStringToFile } from "@/lib";
import { useDisclosure } from "@mantine/hooks";
import { getFileUrl } from "@/lib/config.ts";
import { IAttachment } from "@/lib/types";
import ReactClearModal from "react-clear-modal";
import clsx from "clsx";
import { 
  IconEdit, 
  IconBrain,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import MindMapToolbar from './MindMapToolbar';
import './mindmap.css';

export default function MindMapView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, selected } = props;
  const { src, title, width, attachmentId } = node.attrs;
  
  const mindMapContainerRef = useRef<HTMLDivElement>(null);
  const mindMapInstance = useRef<any>(null);
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [mindMap, setMindMap] = useState<any>(null); // 添加状态来跟踪实例
  const [opened, { open, close }] = useDisclosure(false);
  const computedColorScheme = useComputedColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<string>(computedColorScheme);
  const [isWebFullscreen, setIsWebFullscreen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('logicalStructure');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExportFormatDialog, setShowExportFormatDialog] = useState(false);
  const [exportFormatResolve, setExportFormatResolve] = useState<((format: string) => void) | null>(null);

  const handleThemeChange = () => {
    const newTheme = selectedTheme === 'light' ? 'dark' : 'light';
    setSelectedTheme(newTheme);
    if (mindMapInstance.current) {
      mindMapInstance.current.setTheme(newTheme === 'dark' ? 'dark' : 'default');
    }
  };

  const handleFullscreenToggle = () => {
    setIsWebFullscreen(!isWebFullscreen);
  };

  // 通用的 toast 提示函数
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    
    const colors = {
      success: { bg: '#4caf50', icon: '✅' },
      error: { bg: '#f44336', icon: '❌' },
      info: { bg: '#2196f3', icon: 'ℹ️' }
    };
    
    const { bg, icon } = colors[type];
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bg};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10002;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideInOut 3s ease-in-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // 添加图标
    toast.innerHTML = `${icon} ${message}`;
    
    // 添加CSS动画
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInOut {
          0% { opacity: 0; transform: translateX(100%); }
          15% { opacity: 1; transform: translateX(0); }
          85% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const handleExit = async () => {
    // 检查是否有未保存的更改
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      // 没有未保存的更改，直接退出
      close();
    }
  };

  // 保存并退出
  const handleSaveAndExit = async () => {
    setShowExitConfirm(false);
    try {
      await handleSave();
      close();
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，无法退出', 'error');
    }
  };

  // 不保存直接退出
  const handleDiscardAndExit = () => {
    setShowExitConfirm(false);
    setHasUnsavedChanges(false); // 清理未保存标记
    close();
  };

  // 取消退出
  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  // 处理导出格式选择
  const handleExportFormat = (format: string) => {
    setShowExportFormatDialog(false);
    if (exportFormatResolve) {
      exportFormatResolve(format);
      setExportFormatResolve(null);
    }
  };

  // 取消导出
  const handleCancelExport = () => {
    setShowExportFormatDialog(false);
    if (exportFormatResolve) {
      exportFormatResolve(null);
      setExportFormatResolve(null);
    }
  };

  const handleOpen = async () => {
    if (!editor.isEditable) {
      return;
    }

    setIsLoading(true);
    try {
      
      // 优先从节点属性中读取思维导图数据
      if (node.attrs.mindMapData) {
        setMindMapData(node.attrs.mindMapData);
      } else if (src) {
        // 兼容旧版本：从SVG文件中提取数据
        const url = getFileUrl(src);
        const request = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        });
        
        // 从SVG中提取数据
        const svgText = await request.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const metadata = svgDoc.querySelector('metadata');
        
        if (metadata && metadata.textContent) {
          try {
            const data = JSON.parse(metadata.textContent);
            setMindMapData(data);
          } catch (e) {
            console.error('Failed to parse mindmap data from SVG', e);
          }
        }
      } else {
        setMindMapData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false); // 打开时重置未保存状态
      open();
    }
  };

  const handleExport = async () => {
    if (!mindMapInstance.current) {
      return;
    }

    try {
      setIsLoading(true);
      
      // 获取思维导图数据
      const data = mindMapInstance.current.getData();
      
      // 创建导出选择菜单 - 使用自定义对话框
      const exportFormat = await new Promise<string>((resolve) => {
        setExportFormatResolve(() => resolve);
        setShowExportFormatDialog(true);
      });
      
      if (!exportFormat) {
        return; // 用户取消了
      }
      
      let exportData;
      let filename;
      let mimeType;
      
      if (exportFormat === 'svg') {
        // 导出SVG - 明确使用下载模式
        exportData = await mindMapInstance.current.export('svg', true);
        
        if (exportData && typeof exportData === 'string' && exportData.includes('<svg')) {
          // 将数据嵌入到SVG中作为metadata
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(exportData, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;
          
          if (svgElement.tagName !== 'parsererror') {
            // 添加metadata
            const metadata = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'metadata');
            metadata.textContent = JSON.stringify(data);
            svgElement.appendChild(metadata);
            
            // 确保SVG有正确的尺寸
            if (!svgElement.getAttribute('width') || !svgElement.getAttribute('height')) {
              svgElement.setAttribute('width', '800');
              svgElement.setAttribute('height', '600');
              svgElement.setAttribute('viewBox', '0 0 800 600');
            }
            
            // 序列化SVG
            const serializer = new XMLSerializer();
            exportData = serializer.serializeToString(svgDoc);
            filename = `mindmap-${new Date().getTime()}.svg`;
            mimeType = 'image/svg+xml';
          } else {
            throw new Error('导出的SVG格式无效');
          }
        } else {
          throw new Error('无法导出SVG数据');
        }
      } else {
        // 导出PNG - 明确使用下载模式
        exportData = await mindMapInstance.current.export('png', true);
        
        if (!exportData) {
          throw new Error('无法导出PNG数据');
        }
        
        filename = `mindmap-${new Date().getTime()}.png`;
        mimeType = 'image/png';
      }
      
      // 创建下载链接
      if (exportFormat === 'svg') {
        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // PNG数据已经是data URL格式
        const link = document.createElement('a');
        link.href = exportData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      
    } catch (error) {
      console.error('Failed to export mindmap:', error);
      showToast('导出思维导图失败: ' + (error.message || error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加一个标志防止无限循环
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!mindMapInstance.current || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setIsLoading(true);
      
      // 获取思维导图数据
      const data = mindMapInstance.current.getData();
      
      // 直接从DOM获取SVG，避免使用export方法引起下载
      let svgString = '';
      const svgElements = mindMapContainerRef.current?.querySelectorAll('svg');
      if (svgElements && svgElements.length > 0) {
        const serializer = new XMLSerializer();
        svgString = serializer.serializeToString(svgElements[0]);
      }
      
      if (!svgString || typeof svgString !== 'string') {
        throw new Error('无法导出SVG数据');
      }
      
      // 将思维导图数据嵌入到SVG的metadata中（用于数据恢复）
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      if (svgElement.tagName !== 'parsererror') {
        // 添加思维导图数据作为metadata
        const metadata = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        metadata.textContent = JSON.stringify(data);
        svgElement.appendChild(metadata);
        
        // 确保SVG有正确的尺寸
        if (!svgElement.getAttribute('width') || !svgElement.getAttribute('height')) {
          svgElement.setAttribute('width', '800');
          svgElement.setAttribute('height', '600');
          svgElement.setAttribute('viewBox', '0 0 800 600');
        }
        
        // 序列化SVG
        const serializer = new XMLSerializer();
        const finalSvgString = serializer.serializeToString(svgDoc);
        
        // 创建SVG文件（完全模仿excalidraw）
        const fileName = "mindmap.svg";
        const mindmapSvgFile = await svgStringToFile(finalSvgString, fileName);
        
        const pageId = editor.storage?.pageId;
        
        let attachment: IAttachment = null;
        if (attachmentId) {
          attachment = await uploadFile(mindmapSvgFile, pageId, attachmentId);
        } else {
          attachment = await uploadFile(mindmapSvgFile, pageId);
        }
        
        // 更新节点属性（完全模仿excalidraw）
        updateAttributes({
          src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(attachment.updatedAt).getTime()}`,
          title: attachment.fileName,
          size: attachment.fileSize,
          attachmentId: attachment.id,
          mindMapData: data, // 同时保存数据作为备份
        });
        
        
        // 显示保存成功提示
        const saveSuccessToast = document.createElement('div');
        saveSuccessToast.innerHTML = '✅ 思维导图已保存到服务器';
        
        // 保存成功后清除未保存标记
        setHasUnsavedChanges(false);
        saveSuccessToast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 12px 16px;
          border-radius: 4px;
          z-index: 10002;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          animation: fadeInOut 2s ease-in-out;
        `;
        
        // 添加CSS动画
        if (!document.querySelector('#mindmap-toast-styles')) {
          const style = document.createElement('style');
          style.id = 'mindmap-toast-styles';
          style.textContent = `
            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(-20px); }
              20% { opacity: 1; transform: translateY(0); }
              80% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-20px); }
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(saveSuccessToast);
        
        // 2秒后移除提示
        setTimeout(() => {
          if (saveSuccessToast.parentNode) {
            saveSuccessToast.parentNode.removeChild(saveSuccessToast);
          }
        }, 2000);
        
        // 不要自动关闭编辑器（与excalidraw不同）
        // close();
      } else {
        throw new Error('导出的SVG格式无效');
      }
      
    } catch (error) {
      console.error('Failed to save mindmap:', error);
      showToast('保存思维导图失败: ' + (error.message || error), 'error');
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  };

  // 初始化思维导图
  useEffect(() => {
    if (opened && mindMapContainerRef.current && !mindMapInstance.current) {
      // 动态导入 simple-mind-map
      import('simple-mind-map').then((module) => {
        const MindMap = module.default;
        
        // 动态导入插件
        Promise.all([
          import('simple-mind-map/src/plugins/Drag.js'),
          import('simple-mind-map/src/plugins/KeyboardNavigation.js'),
          import('simple-mind-map/src/plugins/Export.js'),
          import('simple-mind-map/src/plugins/Select.js'),
          import('simple-mind-map/src/plugins/RichText.js'),
          import('simple-mind-map/src/plugins/AssociativeLine.js'),
          import('simple-mind-map/src/plugins/TouchEvent.js'),
          import('simple-mind-map/src/plugins/NodeImgAdjust.js'),
          import('simple-mind-map/src/plugins/MiniMap.js'),
          import('simple-mind-map/src/plugins/Watermark.js'),
          import('simple-mind-map/src/plugins/Painter.js'),
          import('simple-mind-map/src/plugins/Search.js'),
        ]).then(([
          Drag,
          KeyboardNavigation,
          Export,
          Select,
          RichText,
          AssociativeLine,
          TouchEvent,
          NodeImgAdjust,
          MiniMap,
          Watermark,
          Painter,
          Search,
        ]) => {
          // 注册插件
          MindMap.usePlugin(Drag.default)
            .usePlugin(KeyboardNavigation.default)
            .usePlugin(Export.default)
            .usePlugin(Select.default)
            .usePlugin(RichText.default)
            .usePlugin(AssociativeLine.default)
            .usePlugin(TouchEvent.default)
            .usePlugin(NodeImgAdjust.default)
            .usePlugin(MiniMap.default)
            .usePlugin(Watermark.default)
            .usePlugin(Painter.default)
            .usePlugin(Search.default);

          const defaultData = mindMapData || {
            data: {
              text: '中心主题',
              uid: 'root',
              expand: true,
              isActive: false,
            },
            children: [],
          };


          mindMapInstance.current = new MindMap({
            el: mindMapContainerRef.current,
            data: defaultData,
            theme: '', // 不使用预设主题
            layout: currentLayout,
            keyboardNavigation: true,
            readonly: false,
            mouseScaleable: true,
            contextMenu: true,
            toolBar: false,
            nodeTextEditZIndex: 10000,
            nodeNoteTooltipZIndex: 10000,
            enableNodeRichText: false,
            defaultExpandLevel: 3,
            enableFreeDrag: false,
            // 直接在初始化时设置样式
            backgroundColor: selectedTheme === 'dark' ? '#262626' : '#f9fafb',
            paddingX: 8,
            paddingY: 5,
            nodeMargin: 20,
            lineWidth: 1,
            lineColor: '#9ca3af',
            nodeFontSize: 12,
            rootFontSize: 14,
            secondFontSize: 12,
            thirdFontSize: 11,
            otherFontSize: 11,
            borderWidth: 1,
            borderColor: '#d1d5db',
            fillColor: '#ffffff',
            color: '#1f2937',
            borderRadius: 3,
            imgMaxWidth: 80,
            imgMaxHeight: 80,
            iconSize: 16,
          });

          // 应用自定义主题配置，覆盖默认的彩色主题
          mindMapInstance.current.setThemeConfig({
            // 根节点样式
            rootFillColor: '#ffffff',
            rootBorderColor: '#d1d5db',
            rootBorderWidth: 1,
            rootBorderRadius: 4,
            rootColor: '#1f2937',
            rootPaddingX: 12,
            rootPaddingY: 6,
            rootFontSize: 14,
            rootFontWeight: 'normal',
            
            // 普通节点样式  
            fillColor: '#ffffff',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 3,
            color: '#1f2937',
            paddingX: 8,
            paddingY: 4,
            fontSize: 12,
            fontWeight: 'normal',
            
            // 二级节点样式
            secondNodeFillColor: '#ffffff',
            secondNodeBorderColor: '#d1d5db',
            secondNodeBorderWidth: 1,
            secondNodeBorderRadius: 3,
            secondNodeColor: '#1f2937',
            secondNodePaddingX: 6,
            secondNodePaddingY: 3,
            secondNodeFontSize: 11,
            secondNodeFontWeight: 'normal',
            
            // 连线样式
            lineColor: '#9ca3af',
            lineWidth: 1,
            
            // 背景
            backgroundColor: selectedTheme === 'dark' ? '#262626' : '#f9fafb'
          });

          // 强制重新渲染以应用新样式
          mindMapInstance.current.render();

          // 更新状态，让工具栏组件能够接收到实例
          setMindMap(mindMapInstance.current);

          // 尝试直接修改现有节点的样式
          setTimeout(() => {
            if (mindMapInstance.current) {
              try {
                // 获取所有节点并应用样式
                const nodes = mindMapInstance.current.renderer.renderTree.children || [];
                const applyNodeStyle = (node: any) => {
                  if (node && node.nodeData) {
                    // 根据节点层级应用不同样式
                    const isRoot = node.nodeData.isRoot;
                    const level = node.nodeData.layerIndex || 0;
                    
                    if (isRoot) {
                      node.setStyle({
                        fillColor: '#ffffff',
                        borderColor: '#d1d5db',
                        borderWidth: 1,
                        borderRadius: 4,
                        color: '#1f2937',
                        fontSize: 14,
                        fontWeight: 'normal',
                        paddingX: 12,
                        paddingY: 6
                      });
                    } else {
                      node.setStyle({
                        fillColor: '#ffffff',
                        borderColor: '#d1d5db',
                        borderWidth: 1,
                        borderRadius: 3,
                        color: '#1f2937',
                        fontSize: level === 1 ? 12 : 11,
                        fontWeight: 'normal',
                        paddingX: level === 1 ? 8 : 6,
                        paddingY: level === 1 ? 4 : 3
                      });
                    }
                  }
                  
                  // 递归处理子节点
                  if (node.children) {
                    node.children.forEach(applyNodeStyle);
                  }
                };
                
                nodes.forEach(applyNodeStyle);
                mindMapInstance.current.render();
              } catch (error) {
                console.error('应用节点样式失败:', error);
              }
            }
          }, 500);

          // 监听节点激活事件
          mindMapInstance.current.on('node_active', (node, nodeList) => {
            // 可以在这里添加节点激活后的逻辑
          });

          // 监听数据变化
          mindMapInstance.current.on('data_change', () => {
            // 标记为有未保存的更改
            setHasUnsavedChanges(true);
          });

          // 添加键盘快捷键支持
          const handleKeyDown = (e: KeyboardEvent) => {
            // 检查思维导图模态框是否打开并且容器存在
            const mindMapContainer = mindMapContainerRef.current;
            
            // 使用 opened 状态和容器存在性来检查，而不是依赖DOM查询
            if (!mindMapInstance.current || !opened || !mindMapContainer) {
              return;
            }

            // 获取是否在编辑状态 - 使用多种方式检测
            const isEditing = mindMapInstance.current.renderer?.textEdit?.isShow || 
                            document.querySelector('.smm-node-edit-area') !== null ||
                            document.activeElement?.tagName === 'INPUT' ||
                            document.activeElement?.tagName === 'TEXTAREA' ||
                            document.activeElement?.contentEditable === 'true';
            
            // 文件操作快捷键 - 即使在编辑状态也要响应
            if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
              return;
            }

            if (e.ctrlKey && e.key === 'e') {
              e.preventDefault();
              e.stopPropagation();
              handleExport();
              return;
            }

            // 如果正在编辑文本，只允许部分快捷键通过
            if (isEditing) {
              // 在编辑模式下，只阻止思维导图特定的快捷键，让文本编辑快捷键正常工作
              const mindMapSpecificKeys = [
                'Tab', 'Enter', 'Delete', 'Backspace', 'F2', ' ', 'Escape',
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
              ];
              
              const mindMapSpecificCtrlKeys = [
                'z', 'y' // 阻止思维导图的撤销/重做，让文本编辑器处理
              ];
              
              // 如果是思维导图特定的快捷键，就阻止处理
              if (mindMapSpecificKeys.includes(e.key) || 
                  (e.ctrlKey && mindMapSpecificCtrlKeys.includes(e.key))) {
                return; // 让文本编辑器处理这些快捷键
              }
              
              // 其他快捷键（如 Ctrl+A, Ctrl+C, Ctrl+V 等）让浏览器默认处理
              return;
            }

            // 视图操作快捷键
            if (e.ctrlKey && e.key === '0') {
              e.preventDefault();
              // 重置为100%缩放
              if (mindMapInstance.current.view) {
                const cx = mindMapInstance.current.width / 2;
                const cy = mindMapInstance.current.height / 2;
                mindMapInstance.current.view.setScale(1, cx, cy);
              }
            }

            if (e.ctrlKey && e.key === '1') {
              e.preventDefault();
              // 适合窗口
              if (mindMapInstance.current.view) {
                mindMapInstance.current.view.fit();
              }
            }

            // 编辑操作快捷键
            if (e.ctrlKey && e.key === 'z') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              mindMapInstance.current.execCommand('BACK');
              return;
            }

            if (e.ctrlKey && e.key === 'y') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              mindMapInstance.current.execCommand('FORWARD');
              return;
            }

            if (e.ctrlKey && e.key === 'a') {
              e.preventDefault();
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('SELECT_ALL');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.selectAll) {
                  mindMapInstance.current.renderer.selectAll();
                }
              } catch (error) {
                console.error('全选失败:', error);
              }
            }

            if (e.ctrlKey && e.key === 'c') {
              e.preventDefault();
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('COPY_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.copy) {
                  mindMapInstance.current.renderer.copy();
                }
              } catch (error) {
                console.error('复制失败:', error);
              }
            }

            if (e.ctrlKey && e.key === 'v') {
              e.preventDefault();
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('PASTE_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.paste) {
                  mindMapInstance.current.renderer.paste();
                }
              } catch (error) {
                console.error('粘贴失败:', error);
              }
            }

            if (e.ctrlKey && e.key === 'x') {
              e.preventDefault();
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('CUT_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.cut) {
                  mindMapInstance.current.renderer.cut();
                }
              } catch (error) {
                console.error('剪切失败:', error);
              }
            }

            // 节点操作快捷键
            if (e.key === 'Tab') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              // 插入子节点
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('INSERT_CHILD_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.insertChildNode) {
                  mindMapInstance.current.renderer.insertChildNode();
                }
              } catch (error) {
                console.error('插入子节点失败:', error);
              }
              return;
            }

            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              // 插入同级节点
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('INSERT_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.insertSiblingNode) {
                  mindMapInstance.current.renderer.insertSiblingNode();
                }
              } catch (error) {
                console.error('插入同级节点失败:', error);
              }
              return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              // 尝试不同的删除方法
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('REMOVE_NODE');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.removeNode) {
                  mindMapInstance.current.renderer.removeNode();
                } else if (mindMapInstance.current.command) {
                  mindMapInstance.current.command.exec('REMOVE_NODE');
                }
              } catch (error) {
                console.error('删除节点失败:', error);
              }
              return;
            }

            if (e.key === 'F2' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              // 激活节点编辑
              try {
                if (mindMapInstance.current.execCommand) {
                  mindMapInstance.current.execCommand('SET_NODE_TEXT_EDIT');
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.activeNodeText) {
                  mindMapInstance.current.renderer.activeNodeText();
                } else if (mindMapInstance.current.renderer && mindMapInstance.current.renderer.editNode) {
                  mindMapInstance.current.renderer.editNode();
                }
              } catch (error) {
                console.error('激活节点编辑失败:', error);
              }
              return;
            }

            // 导航快捷键
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              const direction = e.key.replace('Arrow', '').toLowerCase();
              mindMapInstance.current.keyCommand.onKeydown(e);
              return;
            }

            // 节点样式快捷键
            if (e.ctrlKey && e.key === 'b') {
              e.preventDefault();
              const activeNodeList = mindMapInstance.current.renderer.activeNodeList;
              if (activeNodeList.length > 0) {
                const currentWeight = activeNodeList[0].getData('fontWeight');
                const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                activeNodeList.forEach(node => {
                  node.setStyle({ fontWeight: newWeight });
                });
                mindMapInstance.current.render();
              }
            }

            if (e.ctrlKey && e.key === 'i') {
              e.preventDefault();
              const activeNodeList = mindMapInstance.current.renderer.activeNodeList;
              if (activeNodeList.length > 0) {
                const currentStyle = activeNodeList[0].getData('fontStyle');
                const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
                activeNodeList.forEach(node => {
                  node.setStyle({ fontStyle: newStyle });
                });
                mindMapInstance.current.render();
              }
            }

            if (e.ctrlKey && e.key === 'u') {
              e.preventDefault();
              const activeNodeList = mindMapInstance.current.renderer.activeNodeList;
              if (activeNodeList.length > 0) {
                const currentDecoration = activeNodeList[0].getData('textDecoration');
                const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
                activeNodeList.forEach(node => {
                  node.setStyle({ textDecoration: newDecoration });
                });
                mindMapInstance.current.render();
              }
            }

            // 主题切换快捷键 (Ctrl+T)
            if (e.ctrlKey && e.key === 't') {
              e.preventDefault();
              handleThemeChange();
            }

            // 退出编辑器快捷键 (Escape)
            if (e.key === 'Escape') {
              e.preventDefault();
              handleExit();
            }
          };

          // 添加键盘事件监听器
          document.addEventListener('keydown', handleKeyDown);

          // 保存清理函数
          mindMapInstance.current._keyboardCleanup = () => {
            document.removeEventListener('keydown', handleKeyDown);
          };

          // 初始化后居中显示
          setTimeout(() => {
            if (mindMapInstance.current) {
              mindMapInstance.current.resize();
              mindMapInstance.current.render();
            }
          }, 100);
        });
      });
    }

    return () => {
      if (mindMapInstance.current) {
        try {
          // 清理键盘事件监听器
          if (mindMapInstance.current._keyboardCleanup) {
            mindMapInstance.current._keyboardCleanup();
          }
          
          // 只有在模态框关闭时才销毁实例
          if (!opened) {
            mindMapInstance.current.destroy();
            mindMapInstance.current = null;
            setMindMap(null); // 清理状态
          }
        } catch (e) {
          console.error('Error destroying mindmap:', e);
        }
      }
    };
  }, [opened, mindMapData, selectedTheme, currentLayout]);

  return (
    <NodeViewWrapper>
      <ReactClearModal
        style={{
          backgroundColor: selectedTheme === 'dark' ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)",
          padding: 0,
          zIndex: 200,
        }}
        isOpen={opened}
        onRequestClose={close}
        disableCloseOnBgClick={true}
        contentProps={{
          style: {
            padding: 0,
            width: isWebFullscreen ? "100vw" : "90vw",
            height: isWebFullscreen ? "100vh" : "90vh",
            maxWidth: isWebFullscreen ? "none" : undefined,
            maxHeight: isWebFullscreen ? "none" : undefined,
            position: isWebFullscreen ? "fixed" : "relative",
            top: isWebFullscreen ? 0 : undefined,
            left: isWebFullscreen ? 0 : undefined,
            borderRadius: isWebFullscreen ? 0 : 8,
            backgroundColor: selectedTheme === 'dark' ? '#1a1a1a' : '#ffffff',
            border: selectedTheme === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* 使用新的 MindMapToolbar 组件 */}
        <MindMapToolbar
          mindMap={mindMap}
          theme={selectedTheme as 'light' | 'dark'}
          onThemeChange={handleThemeChange}
          onSave={handleSave}
          onExport={handleExport}
          onExit={handleExit}
          isSaving={isLoading}
        />

        {/* 思维导图容器 */}
        <div 
          ref={mindMapContainerRef}
          className={`mind-map-container ${selectedTheme === 'dark' ? 'dark' : ''}`}
          style={{ 
            flex: 1,
            width: "100%",
            overflow: "hidden"
          }}
        />
      </ReactClearModal>

      {node.attrs.mindMapData || src ? (
        <Card
          radius="md"
          onClick={(e) => e.detail === 2 && handleOpen()}
          p="md"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: 'pointer',
            width: "320px", // 固定宽度
            height: "120px", // 固定高度
            minWidth: "320px", // 最小宽度
            maxWidth: "500px", // 最大宽度
            position: "relative"
          }}
          withBorder
          className={clsx(selected ? "ProseMirror-selectednode" : "")}
        >
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", textAlign: "center" }}>
            <ActionIcon variant="transparent" color="blue" mb="xs" size="lg">
              <IconBrain size={24} />
            </ActionIcon>

            <Text component="span" size="sm" c="dimmed" weight={500}>
              {t("Double-click to edit Mind Map")}
            </Text>
            
            {node.attrs.lastUpdated && (
              <Text component="span" size="xs" c="dimmed" mt="xs">
                {new Date(node.attrs.lastUpdated).toLocaleString('zh-CN')}
              </Text>
            )}
          </div>

          {selected && editor.isEditable && (
            <ActionIcon
              onClick={handleOpen}
              variant="default"
              color="gray"
              size="sm"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}
        </Card>
      ) : (
        <Card
          radius="md"
          onClick={(e) => e.detail === 2 && handleOpen()}
          p="md"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: 'pointer',
            width: "320px", // 固定宽度
            height: "120px", // 固定高度
            minWidth: "320px", // 最小宽度
            maxWidth: "500px", // 最大宽度
          }}
          withBorder
          className={clsx(selected ? "ProseMirror-selectednode" : "")}
        >
          <div style={{ display: "flex", alignItems: "center", flexDirection: "column", textAlign: "center" }}>
            <ActionIcon variant="transparent" color="blue" mb="xs" size="lg">
              <IconBrain size={24} />
            </ActionIcon>

            <Text component="span" size="sm" c="dimmed" weight={500}>
              {t("Double-click to edit Mind Map")}
            </Text>
          </div>
        </Card>
      )}
      
      {/* 自定义退出确认对话框 */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10003
        }}>
          <div style={{
            backgroundColor: selectedTheme === 'dark' ? '#2d2d2d' : '#ffffff',
            color: selectedTheme === 'dark' ? '#ffffff' : '#000000',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: selectedTheme === 'dark' ? '1px solid #404040' : '1px solid #e0e0e0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💾</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>您有未保存的更改</h3>
              <p style={{ margin: 0, fontSize: '14px', color: selectedTheme === 'dark' ? '#b0b0b0' : '#666666', lineHeight: '1.5' }}>
                在退出之前，请选择如何处理您的更改
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleSaveAndExit}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4caf50'}
              >
                💾 保存并退出
              </button>
              <button
                onClick={handleDiscardAndExit}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
              >
                🗑️ 放弃更改并退出
              </button>
              <button
                onClick={handleCancelExit}
                style={{
                  backgroundColor: 'transparent',
                  color: selectedTheme === 'dark' ? '#ffffff' : '#666666',
                  border: selectedTheme === 'dark' ? '1px solid #404040' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = selectedTheme === 'dark' ? '#404040' : '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 导出格式选择对话框 */}
      {showExportFormatDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10003
        }}>
          <div style={{
            backgroundColor: selectedTheme === 'dark' ? '#2d2d2d' : '#ffffff',
            color: selectedTheme === 'dark' ? '#ffffff' : '#000000',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: selectedTheme === 'dark' ? '1px solid #404040' : '1px solid #e0e0e0'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>选择导出格式</h3>
              <p style={{ margin: 0, fontSize: '14px', color: selectedTheme === 'dark' ? '#b0b0b0' : '#666666', lineHeight: '1.5' }}>
                请选择您希望导出的文件格式
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleExportFormat('svg')}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'flex-start'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#4caf50'}
              >
                <span style={{ fontSize: '18px' }}>🎨</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>SVG 格式</div>
                  <div style={{ fontSize: '12px', opacity: '0.9' }}>矢量图，适合再次编辑和缩放</div>
                </div>
              </button>
              <button
                onClick={() => handleExportFormat('png')}
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'flex-start'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1976d2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2196f3'}
              >
                <span style={{ fontSize: '18px' }}>🖼️</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>PNG 格式</div>
                  <div style={{ fontSize: '12px', opacity: '0.9' }}>图片格式，适合分享和打印</div>
                </div>
              </button>
              <button
                onClick={handleCancelExport}
                style={{
                  backgroundColor: 'transparent',
                  color: selectedTheme === 'dark' ? '#ffffff' : '#666666',
                  border: selectedTheme === 'dark' ? '1px solid #404040' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = selectedTheme === 'dark' ? '#404040' : '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}