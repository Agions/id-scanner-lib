/**
 * @file OCR Worker
 * @description OCR处理的Worker线程实现
 * @module modules/id-card/ocr-worker
 */

import { IDCardInfo, IDCardType } from './types';
import { LoggerMessage } from 'tesseract.js';

/**
 * OCR处理输入参数
 */
export interface OCRProcessInput {
  /** 图像Base64数据 */
  imageBase64: string;
  /** Tesseract Worker选项 */
  tessWorkerOptions?: {
    /** 语言 */
    language?: string;
    /** 日志回调 */
    logger?: (message: LoggerMessage) => void;
  };
}

/**
 * 在Worker中处理OCR识别
 * @param input OCR处理输入参数
 * @returns OCR处理结果
 */
export async function processOCRInWorker(
  input: OCRProcessInput
): Promise<{ idCardInfo: IDCardInfo; processingTime: number }> {
  const startTime = performance.now();

  try {
    // 导入Tesseract.js
    const { createWorker } = await import('tesseract.js');

    // 创建Tesseract Worker
    const worker = createWorker({
      logger: input.tessWorkerOptions?.logger
    });

    // 初始化Worker
    await worker.load();
    await worker.loadLanguage('chi_sim');
    await worker.initialize('chi_sim');

    // 设置识别参数
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789X年月日壹贰叁肆伍陆柒捌玖拾民族汉满回维吾尔藏苗彝壮朝鲜侗瑶白土家哈尼哈萨克傣黎傈僳佤高山拉祜水东乡纳西景颇柯尔克孜达斡尔仫佬羌布朗撒拉毛南仡佬锡伯阿昌普米塔吉克怒乌孜别克俄罗斯鄂温克德昂保安裕固京塔塔尔独龙鄂伦春赫哲门巴珞巴基诺男女住址出生公民身份号码签发机关有效期省市区县乡镇街道号楼单元室ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      tessedit_pageseg_mode: 7, // PSM_SINGLE_LINE
      preserve_interword_spaces: '1'
    });

    // 识别图像
    const { data } = await worker.recognize(input.imageBase64);

    // 解析身份证信息
    const idCardInfo = parseIDCardText(data.text);

    // 释放Worker资源
    await worker.terminate();

    const processingTime = performance.now() - startTime;

    return { idCardInfo, processingTime };
  } catch (error) {
    console.error('OCR处理错误:', error);
    return {
      idCardInfo: {} as IDCardInfo,
      processingTime: performance.now() - startTime
    };
  }
}

/**
 * 解析身份证文本
 * @param text OCR识别的文本
 * @returns 解析后的身份证信息
 */
function parseIDCardText(text: string): IDCardInfo {
  const info: IDCardInfo = {};

  // 预处理文本，清除多余空白
  const processedText = text.replace(/\s+/g, ' ').trim();

  // 解析身份证号码
  const idNumberRegex = /(\d{17}[\dX])/;
  const idNumberWithPrefixRegex = /公民身份号码[\s\:]*(\d{17}[\dX])/;

  const basicMatch = processedText.match(idNumberRegex);
  const prefixMatch = processedText.match(idNumberWithPrefixRegex);

  if (prefixMatch && prefixMatch[1]) {
    info.idNumber = prefixMatch[1];
  } else if (basicMatch && basicMatch[1]) {
    info.idNumber = basicMatch[1];
  }

  // 解析姓名
  const nameWithLabelRegex = /姓名[\s\:]*([一-龥]{2,4})/;
  const nameMatch = processedText.match(nameWithLabelRegex);

  if (nameMatch && nameMatch[1]) {
    info.name = nameMatch[1].trim();
  } else {
    // 备用方案：查找短行且内容全是汉字
    const lines = processedText.split('\n').filter(line => line.trim());
  for (const line of lines) {
    if (
        line.length >= 2 &&
        line.length <= 5 &&
        /^[一-龥]+$/.test(line) &&
        !/性别|民族|住址|公民|签发|有效/.test(line)
    ) {
        info.name = line.trim();
        break;
      }
    }
  }

  // 解析性别和民族
  const genderAndNationalityRegex = /性别[\s\:]*([男女])[\s ]*民族[\s\:]*([一-龥]+族)/;
  const genderOnlyRegex = /性别[\s\:]*([男女])/;
  const nationalityOnlyRegex = /民族[\s\:]*([一-龥]+族)/;

  const genderNationalityMatch = processedText.match(genderAndNationalityRegex);
  const genderOnlyMatch = processedText.match(genderOnlyRegex);
  const nationalityOnlyMatch = processedText.match(nationalityOnlyRegex);

  if (genderNationalityMatch) {
    info.gender = genderNationalityMatch[1];
    info.ethnicity = genderNationalityMatch[2];
  } else {
    if (genderOnlyMatch) info.gender = genderOnlyMatch[1];
    if (nationalityOnlyMatch) info.ethnicity = nationalityOnlyMatch[1];
  }

  // 根据内容判断身份证类型
  if (processedText.includes('出生') || processedText.includes('公民身份号码')) {
    info.type = IDCardType.FRONT; // 确保类型为枚举值而不是字符串
  } else if (processedText.includes('签发机关') || processedText.includes('有效期')) {
    info.type = IDCardType.BACK; // 确保类型为枚举值而不是字符串
  }

  // 解析出生日期
  const birthDateRegex1 = /出生[\s\:]*(\d{4})年(\d{1,2})月(\d{1,2})[日号]/;
  const birthDateRegex2 = /出生[\s\:]*(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/;
  const birthDateRegex3 = /出生日期[\s\:]*(\d{4})[-\/\.\u5e74](\d{1,2})[-\/\.\u6708](\d{1,2})[日号]?/;

  let birthDateMatch =
    processedText.match(birthDateRegex1) ||
    processedText.match(birthDateRegex2) ||
    processedText.match(birthDateRegex3);

  if (!birthDateMatch && info.idNumber && info.idNumber.length === 18) {
    const year = info.idNumber.substring(6, 10);
    const month = info.idNumber.substring(10, 12);
    const day = info.idNumber.substring(12, 14);
    info.birthDate = `${year}-${month}-${day}`;
  } else if (birthDateMatch) {
    const year = birthDateMatch[1];
    const month = birthDateMatch[2].padStart(2, '0');
    const day = birthDateMatch[3].padStart(2, '0');
    info.birthDate = `${year}-${month}-${day}`;
  }

  // 解析地址
  const addressRegex1 = /住址[\s\:]*([\s\S]*?)(?=公民身份|出生|性别|签发)/;
  const addressRegex2 = /住址[\s\:]*([一-龥a-zA-Z0-9\s\.\-]+)/;

  const addressMatch =
    processedText.match(addressRegex1) || processedText.match(addressRegex2);

  if (addressMatch && addressMatch[1]) {
    info.address = addressMatch[1]
      .replace(/\s+/g, '')
      .replace(/\n/g, '')
      .trim();

    if (info.address.length > 70) {
      info.address = info.address.substring(0, 70);
    }

    if (!/[一-龥]/.test(info.address)) {
      info.address = '';
    }
  }

  // 解析签发机关
  const authorityRegex1 = /签发机关[\s\:]*([\s\S]*?)(?=有效|公民|出生|\d{8}|$)/;
  const authorityRegex2 = /签发机关[\s\:]*([一-龥\s]+)/;

  const authorityMatch =
    processedText.match(authorityRegex1) ||
    processedText.match(authorityRegex2);

  if (authorityMatch && authorityMatch[1]) {
    info.issueAuthority = authorityMatch[1]
      .replace(/\s+/g, '')
      .replace(/\n/g, '')
      .trim();
  }

  // 解析有效期限
  const validPeriodRegex1 = /有效期限[\s\:]*(\d{4}[-\.\u5e74\s]\d{1,2}[-\.\u6708\s]\d{1,2}[日\s]*)[-\s]*(至|-)[-\s]*(\d{4}[-\.\u5e74\s]\d{1,2}[-\.\u6708\s]\d{1,2}[日]*|[永久长期]*)/;
  const validPeriodRegex2 = /有效期限[\s\:]*(\d{8})[-\s]*(至|-)[-\s]*(\d{8}|[永久长期]*)/;

  const validPeriodMatch =
    processedText.match(validPeriodRegex1) ||
    processedText.match(validPeriodRegex2);

  if (validPeriodMatch) {
    if (validPeriodMatch[1] && validPeriodMatch[3]) {
      const startDate = formatDateString(validPeriodMatch[1]);
      const endDate = /\d/.test(validPeriodMatch[3])
        ? formatDateString(validPeriodMatch[3])
        : '长期有效';

      info.validFrom = startDate;
      info.validTo = endDate;
      info.validPeriod = `${startDate}-${endDate}`;
    } else {
      info.validPeriod = validPeriodMatch[0].replace('有效期限', '').trim();
    }
  }

  return info;
}

/**
 * 格式化日期字符串
 * @param dateStr 原始日期字符串
 * @returns 格式化后的日期字符串
 */
function formatDateString(dateStr: string): string {
  // 提取年月日
  const dateMatch = dateStr.match(
    /(\d{4})[-\.\u5e74\s]*(\d{1,2})[-\.\u6708\s]*(\d{1,2})[日]*/
  );
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2].padStart(2, '0');
    const day = dateMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 纯数字格式如 20220101
  if (/^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  // 无法格式化，返回原始字符串
  return dateStr;
}
