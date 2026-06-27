// ── Module content definitions from your actual lessons ──
const MODULE_CONTENT = {
  module1: {
    name: 'Introduction to Computers and History of Computers',
    lessons: {
      lesson1: `A computer is an electronic device that accepts data, processes it according to a set of instructions (program), stores the data, and produces meaningful information as output.

A computer performs four basic operations:
1. Input - The process of entering data into the computer. Examples: typing using a keyboard, clicking using a mouse, scanning documents.
2. Processing - The computer manipulates data and performs calculations. Example: calculating a student's average grade.
3. Storage - The computer saves data for future use. Examples: Hard Disk Drive (HDD), Solid State Drive (SSD).
4. Output - The computer presents processed information. Examples: monitor display, printed reports, audio from speakers.

Data is raw facts that can be interpreted and used by computers. Examples include student names, examination scores, attendance records, and product prices. When data is processed, it becomes information.

The history of computers:
- Abacus: The first man-made mechanical computing device.
- Blaise Pascal: Invented the Pascaline in 1642.
- Gottfried Leibniz: Created the Stepped Reckoner.
- Charles Babbage: Known as the "Father of Computer".
- Herman Hollerith: Developed punched card tabulating.
- Howard Aiken: Completed the Mark I in 1944.
- John Atanasoff & Clifford Berry: Built the first electronic computer (ABC).

Generations of Computers:
- 1st Generation (1951-1958): Vacuum tubes
- 2nd Generation (1959-1964): Transistors
- 3rd Generation (1964-1971): Integrated circuits
- 4th Generation (1971-1979): Microprocessors
- 5th Generation (1979-Present): AI and machine learning`,
    },
  },
  module2: {
    name: 'Language & Types of Computers with Their Uses',
    lessons: {
      lesson1: `The Binary System is the language of the computer because it is composed of 2 bits.

A bit is the smallest unit of measurement in a computer. It can be either 0 or 1.

A byte is a unit of measurement that denotes one character. One byte = 8 bits.

Types of Computers:
- Personal Computer (PC): Single-user system with a moderately powerful microprocessor.
- Workstation: Similar to PC but with a more powerful microprocessor.
- Minicomputer: Multi-processing system supporting up to 250 users.
- Mainframe: Large, expensive computer supporting hundreds or thousands of users.
- Supercomputer: One of the fastest computers, used for specialized applications.`,
    },
  },
  module3: {
    name: 'Number System & Conversions',
    lessons: {
      lesson1: `The Decimal Number System has base 10 and uses digits 0-9.

The Binary Number System has base 2 and uses only digits 0 and 1.

Binary to Decimal Conversion: Use expanded notation in base 2.
Example: 10101₂ = 1×2⁴ + 0×2³ + 1×2² + 0×2¹ + 1×2⁰ = 21₁₀

Decimal to Binary Conversion: Divide by 2 and read remainders upward.`,
    },
  },
  module4: {
    name: 'Hardware Components, Input and Output Devices & Basic PC-Building',
    lessons: {
      parts: `The Motherboard connects all parts of a computer together.

The CPU (Central Processing Unit) is the "brain" of the computer. Components:
- Memory/Storage Unit: Stores instructions and data
- Control Unit: Controls operations
- Arithmetic Logic Unit (ALU): Performs calculations and logic operations

Ports connect external devices: Serial, Parallel, PS/2, USB, VGA, Ethernet.

Input Devices: keyboard, mouse, microphone, scanner, joystick, light pen, trackball, digitizer, MICR, OCR, barcode reader, OMR.

Output Devices: monitor, printer, speakers.

Printers: Impact (Dot Matrix, Daisy Wheel, Drum, Chain) and Non-Impact (Laser, Inkjet).`,
    },
  },
  module5: {
    name: 'Types of Software',
    lessons: {
      software: `Software is a collection of programs and instructions.

System Software manages computer hardware. Examples: Operating Systems (Windows, macOS, Android, iOS), Device Drivers, Compilers, Utility Programs.

Application Software helps users perform tasks. Examples: Microsoft Word, Excel, PowerPoint, Google Chrome, VLC Media Player, Games.

The Operating System is the most important system software. It acts as a bridge between user, software, and hardware.`,
    },
  },
  module6: {
    name: 'Networking Fundamentals',
    lessons: {
      characteristics: `A Computer Network connects multiple computers to share information and resources.

Characteristics: Share resources, access files from other computers, connect printers and scanners.

Hardware: Network Cables, Distributors, Routers, Network Cards (NIC).

Internet: Worldwide system using TCP/IP protocol.

Intranet: Private network for organizations.

Network Areas:
- LAN (Local Area Network): Same building
- WAN (Wide Area Network): Different cities/countries
- MAN (Metropolitan Area Network): Across a region
- Wireless LAN: No cables required`,
    },
  },
  module7: {
    name: 'Microsoft Office Applications',
    lessons: {
      intro: `Microsoft Office is a suite of productivity applications.

Microsoft Word: Word processing for documents, reports, letters.

Microsoft Excel: Spreadsheets for data analysis, calculations, charts.

Microsoft PowerPoint: Presentations and slideshows.

Microsoft Outlook: Email and personal information management.

Microsoft OneNote: Note-taking.

Microsoft Access: Database management.`,
    },
  },
  module8: {
    name: 'Application of Computers in Different Fields',
    lessons: {
      applications: `Computers are used in various fields:

1. Business: Payroll, budgeting, sales analysis, forecasting, inventory management.

2. Banking: Online banking, account management, deposits/withdrawals, interest calculation, ATM operations.

3. Education: Online learning, research, computer-based tests, student tracking.

4. Marketing: Advertising, home shopping, catalogues.

5. Military: Missile control, communication, operation planning, smart weapons.

6. Healthcare: Patient records, diagnostic systems, lab-diagnostic systems, patient monitoring, pharma information, surgery.`,
    },
  },
  module9: {
    name: 'Keyboarding',
    lessons: {
      keyboarding: `Keyboarding is the skill of typing efficiently.

Basic Shortcuts:
- Ctrl+C: Copy
- Ctrl+X: Cut
- Ctrl+V: Paste
- Ctrl+Z: Undo
- Ctrl+Y: Redo
- Ctrl+S: Save
- Ctrl+P: Print
- Ctrl+F: Find
- Ctrl+A: Select all

Word Shortcuts:
- Ctrl+B: Bold
- Ctrl+I: Italic
- Ctrl+U: Underline
- Ctrl+E: Center
- Ctrl+L: Left align
- Ctrl+R: Right align
- Ctrl+J: Justify
- F7: Spell check
- F12: Save As

Windows Shortcuts:
- Alt+Tab: Switch applications
- Alt+F4: Close program
- Ctrl+Alt+Del: Task Manager
- Win+D: Show desktop
- Win+E: Open File Explorer
- Win+L: Lock computer`,
    },
  },
};

async function getLessonContent(moduleId, lessonId) {
  try {
    // Get content from hardcoded definitions
    const module = MODULE_CONTENT[moduleId];
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const lesson = module.lessons[lessonId];
    if (!lesson) {
      throw new Error(`Lesson ${lessonId} not found in ${moduleId}`);
    }

    return lesson;
  } catch (error) {
    console.error('Error loading lesson content:', error);
    throw new Error('Failed to load lesson content');
  }
}

export { getLessonContent };