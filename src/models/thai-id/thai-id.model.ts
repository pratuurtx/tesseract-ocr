export interface ExtractThaiIdDataReqDTO {
    base64ImageStr: string;
    lang?: string;
    oem?: number;
    psm?: number;
    dpi?: string;
}

export interface ExtractThaiIdDataResDTO {
    idCardNo: string | null;
    prefixTh: string | null;
    nameTh: string | null;
    lastNameTh: string | null;
    prefixEn: string | null;
    nameEn: string | null;
    lastNameEn: string | null;
    dob: string | null; // date of birth
    dateOfExpiry: string | null;
}