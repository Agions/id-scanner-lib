/**
 * @file OCR Worker处理模块
 * @description 用于在Web Worker中执行OCR处理
 * @module OCRWorker
 */

import type { IDCardInfo } from '../utils/types';

/**
 * OCR处理输入接口
 */
export interface OCRProcessInput {
  imageBase64: string;
  tessWorkerOptions?: any;
}

/**
 * OCR处理输出接口
 */
export interface OCRProcessOutput {
  idCardInfo: IDCardInfo;
  processingTime: number;
}

/**
 * 在Web Worker中执行OCR处理的函数
 * 
 * 该函数用于在使用 createWorker 创建的 Worker 中执行
 * 
 * @param input OCR处理输入数据
 * @returns OCR处理结果
 */
export async function processOCRInWorker(input: OCRProcessInput): Promise<OCRProcessOutput> {
  // 计时开始
  const startTime = performance.now();
  
  // 加载Tesseract.js (Worker 环境下动态导入)
  const { createWorker } = await import('tesseract.js');
  
  // 创建OCR Worker
  const worker = await createWorker(input.tessWorkerOptions || {
    logger: (m: any) => console.log(m)
  }) as any; // 添加类型断言，避免TypeScript错误
  
  try {
    // 初始化OCR引擎
    await worker.load();
    await worker.loadLanguage('chi_sim');
    await worker.initialize('chi_sim');
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789X-年月日一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz民族汉族满族回族维吾尔族藏族苗族彝族壮族朝鲜族侗族瑶族白族土家族哈尼族哈萨克族傣族黎族傈僳族佤族高山族拉祜族水族东乡族钠西族景颇族柯尔克孜族士族达斡尔族仫佬族羌族布朗族撒拉族毛南族仡佬族锡伯族阿昌族普米族塔吉克族怒族乌孜别克族俄罗斯族鄂温克族德昂族保安族裕固族京族塔塔尔族独龙族鄂伦春族赫哲族门巴族珞巴族基诺族男女性别住址出生公民身份号码签发机关有效期'
    });
    
    // 识别图像
    const { data } = await worker.recognize(input.imageBase64);
    
    // 解析识别结果
    const idCardInfo = parseIDCardText(data.text);
    
    // 处理完成后终止worker
    await worker.terminate();
    
    // 计算处理时间
    const processingTime = performance.now() - startTime;
    
    // 返回处理结果
    return {
      idCardInfo,
      processingTime
    };
  } catch (error) {
    // 确保资源被释放
    await worker.terminate();
    throw error;
  }
}

/**
 * 解析身份证文本信息
 * 
 * 从OCR识别到的文本中提取结构化的身份证信息
 * 
 * @private
 * @param {string} text - OCR识别到的文本
 * @returns {IDCardInfo} 提取到的身份证信息对象
 */
function parseIDCardText(text: string): IDCardInfo {
  const info: IDCardInfo = {};
  
  // 拆分为行
  const lines = text.split('\n').filter(line => line.trim());
  
  // 解析身份证号码（最容易识别的部分）
  const idNumberRegex = /(\d{17}[\dX])/;
  const idNumberMatch = text.match(idNumberRegex);
  if (idNumberMatch) {
    info.idNumber = idNumberMatch[1];
  }
  
  // 解析姓名
  for (const line of lines) {
    if (line.includes('姓名') || line.length < 10 && line.length > 1 && !/\d/.test(line)) {
      info.name = line.replace('姓名', '').trim();
      break;
    }
  }
  
  // 解析性别和民族
  const genderNationalityRegex = /(男|女).*(族)/;
  const genderMatch = text.match(genderNationalityRegex);
  if (genderMatch) {
    info.gender = genderMatch[1];
    const nationalityText = genderMatch[0];
    info.nationality = nationalityText.substring(nationalityText.indexOf(genderMatch[1]) + 1).trim();
  }
  
  // 解析出生日期
  const birthDateRegex = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
  const birthDateMatch = text.match(birthDateRegex);
  if (birthDateMatch) {
    info.birthDate = `${birthDateMatch[1]}-${birthDateMatch[2]}-${birthDateMatch[3]}`;
  }
  
  // 解析地址
  const addressRegex = /住址([\s\S]*?)公民身份号码/;
  const addressMatch = text.match(addressRegex);
  if (addressMatch) {
    info.address = addressMatch[1].replace(/\n/g, '').trim();
  }
  
  // 解析签发机关
  const authorityRegex = /签发机关([\s\S]*?)有效期/;
  const authorityMatch = text.match(authorityRegex);
  if (authorityMatch) {
    info.issuingAuthority = authorityMatch[1].replace(/\n/g, '').trim();
  }
  
  // 解析有效期限
  const validPeriodRegex = /有效期限([\s\S]*?)(-|至)/;
  const validPeriodMatch = text.match(validPeriodRegex);
  if (validPeriodMatch) {
    info.validPeriod = validPeriodMatch[0].replace('有效期限', '').trim();
  }
  
  return info;
} 