// 마크다운 렌더링 유틸리티
// **bold** 문법을 <strong> 태그로 변환

export const renderMarkdown = (text) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

export const md = (text) => ({ __html: renderMarkdown(text) })
