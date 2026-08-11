// Shared id → display-label lookups for modules and quiz types.
//
// The backend stores only the ids (moduleId, quizType) on a room, so the
// waiting lobby — especially the JOIN view, which never sees the rich objects
// the host picked on select_module/select_type — uses these to show readable
// names. Keep in sync with the MODULES list in select_module.jsx and the
// quizTypes list in select_type.jsx.

export const MODULE_LABELS = {
  module1: 'Introduction to Computers and History of Computers',
  module2: 'Language & Types of Computers with Their Uses',
  module3: 'Number System & Conversions',
  module4: 'Hardware Components, Input and Output Devices & Basic PC-Building',
  module5: 'Types of Software',
  module6: 'Networking Fundamentals',
  module7: 'Microsoft Office Applications',
  module8: 'Application of Computers in Different Fields',
  module9: 'Keyboarding',
};

export const QUIZ_TYPE_LABELS = {
  multiple: 'Multiple Choice',
  'true-false': 'True or False',
  identification: 'Identification',
  'fill-in-blank': 'Fill-in-the-Blank',
  mixed: 'Mixed Type',
};

export const moduleLabelFromId = (id) => MODULE_LABELS[id] || '';
export const quizTypeLabelFromId = (id) => QUIZ_TYPE_LABELS[id] || '';
