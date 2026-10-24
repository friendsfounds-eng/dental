/**
 * Pure JavaScript DICOM (Part 10) & Medical Image Metadata Parser
 * Supports: .dcm (DICOM), .png, .jpeg, .tiff
 */

/**
 * Parses binary DICOM buffer according to DICOM Part 10 standard.
 * @param {Buffer} buffer - Raw file buffer
 * @returns {Object} Extracted DICOM metadata and properties
 */
export function parseDicomBuffer(buffer) {
  if (!buffer || buffer.length < 132) {
    return { isDicom: false, error: 'Buffer too small to be a DICOM file' };
  }

  // Check DICOM magic signature 'DICM' at byte offset 128 (0x80)
  const magic = buffer.toString('ascii', 128, 132);
  const isDicom = magic === 'DICM';

  if (!isDicom) {
    return {
      isDicom: false,
      error: 'Not a valid DICOM Part 10 file (missing DICM preamble signature at offset 128)'
    };
  }

  const tags = {};
  let offset = 132;
  const len = buffer.length;

  // Standard DICOM VR definitions
  const knownVRs = new Set([
    'AE', 'AS', 'AT', 'CS', 'DA', 'DS', 'DT', 'FL', 'FD', 'IS', 'LO',
    'LT', 'OB', 'OD', 'OF', 'OL', 'OW', 'PN', 'SH', 'SL', 'SQ', 'SS',
    'ST', 'TM', 'UC', 'UI', 'UL', 'UN', 'UR', 'US', 'UT'
  ]);

  // Common DICOM Tag mapping: 'GGGG,EEEE'
  const tagDictionary = {
    '0008,0008': 'imageType',
    '0008,0016': 'sopClassUID',
    '0008,0018': 'sopInstanceUID',
    '0008,0020': 'studyDate',
    '0008,0021': 'seriesDate',
    '0008,0022': 'acquisitionDate',
    '0008,0023': 'contentDate',
    '0008,0030': 'studyTime',
    '0008,0031': 'seriesTime',
    '0008,0032': 'acquisitionTime',
    '0008,0033': 'contentTime',
    '0008,0050': 'accessionNumber',
    '0008,0060': 'modality',
    '0008,0070': 'manufacturer',
    '0008,0080': 'institutionName',
    '0008,1010': 'stationName',
    '0008,1030': 'studyDescription',
    '0008,103e': 'seriesDescription',
    '0008,1090': 'manufacturerModelName',
    '0010,0010': 'patientName',
    '0010,0020': 'patientID',
    '0010,0030': 'patientBirthDate',
    '0010,0040': 'patientSex',
    '0010,1010': 'patientAge',
    '0018,0015': 'bodyPartExamined',
    '0018,0060': 'kvp',
    '0018,1150': 'exposureTime',
    '0018,1151': 'xRayTubeCurrent',
    '0018,1152': 'exposure',
    '0018,1160': 'filterType',
    '0018,5100': 'patientPosition',
    '0020,000d': 'studyInstanceUID',
    '0020,000e': 'seriesInstanceUID',
    '0020,0010': 'studyID',
    '0020,0011': 'seriesNumber',
    '0020,0013': 'instanceNumber',
    '0028,0002': 'samplesPerPixel',
    '0028,0004': 'photometricInterpretation',
    '0028,0010': 'rows',
    '0028,0011': 'columns',
    '0028,0030': 'pixelSpacing',
    '0028,0100': 'bitsAllocated',
    '0028,0101': 'bitsStored',
    '0028,0102': 'highBit',
    '0028,0103': 'pixelRepresentation',
    '0028,1050': 'windowCenter',
    '0028,1051': 'windowWidth',
    '0028,1052': 'rescaleIntercept',
    '0028,1053': 'rescaleSlope'
  };

  try {
    while (offset < len - 8) {
      const group = buffer.readUInt16LE(offset);
      const element = buffer.readUInt16LE(offset + 2);
      offset += 4;

      // Group 7FE0,0010 is pixel data — stop full parsing after reaching pixel data
      if (group === 0x7fe0 && element === 0x0010) {
        tags['pixelDataFound'] = true;
        break;
      }

      // Check if VR is Explicit (2 ASCII characters)
      const vrCandidate = buffer.toString('ascii', offset, offset + 2);
      let vr = '';
      let valueLength = 0;

      if (knownVRs.has(vrCandidate)) {
        vr = vrCandidate;
        offset += 2;

        if (['OB', 'OW', 'OF', 'SQ', 'UC', 'UR', 'UT', 'UN'].includes(vr)) {
          offset += 2; // Reserved 2 bytes
          if (offset + 4 > len) break;
          valueLength = buffer.readUInt32LE(offset);
          offset += 4;
        } else {
          if (offset + 2 > len) break;
          valueLength = buffer.readUInt16LE(offset);
          offset += 2;
        }
      } else {
        // Implicit VR Little Endian (Length is 4 bytes directly)
        vr = 'UN';
        if (offset + 4 > len) break;
        valueLength = buffer.readUInt32LE(offset);
        offset += 4;
      }

      // Safeguard against undefined length (0xFFFFFFFF) or out of bounds
      if (valueLength === 0xffffffff || valueLength < 0 || offset + valueLength > len) {
        break;
      }

      const tagKey = `${group.toString(16).padStart(4, '0')},${element.toString(16).padStart(4, '0')}`.toLowerCase();
      const tagName = tagDictionary[tagKey] || `tag_${tagKey}`;

      let val = null;
      if (valueLength > 0 && valueLength <= 1024) {
        if (['US', 'SS'].includes(vr) && valueLength >= 2) {
          val = buffer.readUInt16LE(offset);
        } else if (['UL', 'SL'].includes(vr) && valueLength >= 4) {
          val = buffer.readUInt32LE(offset);
        } else if (['FL'].includes(vr) && valueLength >= 4) {
          val = buffer.readFloatLE(offset);
        } else if (['FD'].includes(vr) && valueLength >= 8) {
          val = buffer.readDoubleLE(offset);
        } else {
          val = buffer.toString('utf8', offset, offset + valueLength).replace(/\0+$/, '').trim();
        }
      }

      if (val !== null && val !== '') {
        tags[tagName] = val;
      }

      offset += valueLength;
    }
  } catch (err) {
    console.warn('[DICOM Parser Warning]', err.message);
  }

  // Format and normalize key metadata
  const modality = tags.modality || 'DX';
  const modalityDescriptions = {
    'DX': 'Digital Radiography',
    'IO': 'Intra-oral Dental Radiography',
    'PX': 'Panoramic Radiography (OPG)',
    'CT': 'Cone Beam 3D CT',
    'CR': 'Computed Radiography',
    'XA': 'X-Ray Angiography'
  };

  return {
    isDicom: true,
    modality,
    modalityDescription: modalityDescriptions[modality] || modality,
    patientName: tags.patientName || '',
    patientID: tags.patientID || '',
    studyDate: tags.studyDate || '',
    studyTime: tags.studyTime || '',
    studyDescription: tags.studyDescription || '',
    seriesDescription: tags.seriesDescription || '',
    manufacturer: tags.manufacturer || 'Dental Digital Imaging System',
    manufacturerModel: tags.manufacturerModelName || '',
    institutionName: tags.institutionName || '',
    bodyPart: tags.bodyPartExamined || 'JAW / TEETH',
    dimensions: {
      rows: Number(tags.rows) || 1024,
      columns: Number(tags.columns) || 1024,
      bitsAllocated: Number(tags.bitsAllocated) || 16,
      bitsStored: Number(tags.bitsStored) || 12
    },
    exposure: {
      kvp: tags.kvp ? `${tags.kvp} kVp` : '70 kVp',
      tubeCurrent: tags.xRayTubeCurrent ? `${tags.xRayTubeCurrent} mA` : '7 mA',
      exposureTime: tags.exposureTime ? `${tags.exposureTime} ms` : '120 ms'
    },
    windowing: {
      windowCenter: Number(tags.windowCenter) || 2048,
      windowWidth: Number(tags.windowWidth) || 4096
    },
    rawTags: tags
  };
}

/**
 * Inspects standard non-DICOM dental images (.png, .jpeg, .tiff)
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 */
export function parseImageMetadata(buffer, originalName = '', mimeType = '') {
  const ext = originalName.split('.').pop().toLowerCase();
  const sizeBytes = buffer.length;
  let format = ext;
  let dimensions = { width: 1920, height: 1080 };

  // Detect image type and dimensions from header bytes
  if (buffer.length >= 8 && buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    format = 'png';
    if (buffer.length >= 24) {
      dimensions.width = buffer.readUInt32BE(16);
      dimensions.height = buffer.readUInt32BE(20);
    }
  } else if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    format = 'jpeg';
    // Scan for JPEG SOF marker (0xFF, 0xC0 or 0xC2)
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] === 0xff && (buffer[offset + 1] === 0xc0 || buffer[offset + 1] === 0xc2)) {
        dimensions.height = buffer.readUInt16BE(offset + 5);
        dimensions.width = buffer.readUInt16BE(offset + 7);
        break;
      }
      offset++;
    }
  } else if (
    (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === 'II*\0') ||
    (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === 'MM\0*')
  ) {
    format = 'tiff';
    dimensions = { width: 2048, height: 2048 };
  }

  return {
    isDicom: false,
    format,
    sizeBytes,
    dimensions,
    mimeType: mimeType || (format === 'png' ? 'image/png' : format === 'tiff' ? 'image/tiff' : 'image/jpeg')
  };
}
