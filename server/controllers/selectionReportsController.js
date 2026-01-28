const model = require('../models/selectionReportModel');
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');

// --- PATH CONFIGURATION ---
const PROJECT_ROOT = path.join(__dirname, '..'); 
const PATH_TO_RCF_LOGO = path.join(PROJECT_ROOT, 'public', 'assets', 'rcf_logo-removebg-preview.png');
const PATH_TO_PP_LOGO = path.join(PROJECT_ROOT, 'public', 'assets', 'logo.png');
const GENERATED_FILES_ROOT = path.join(process.env.FILE_STORAGE_PATH || './storage', 'generated-report-data');

// Ensure storage directory exists for server-side copies
if (!fs.existsSync(GENERATED_FILES_ROOT)) {
    fs.mkdirSync(GENERATED_FILES_ROOT, { recursive: true });
} 

// --- INITIAL DATA & FETCH ---
exports.getInitialData = async (req, res) => {
    try {
        const years = await model.getAcademicYears();
        res.json({ years });
    } catch (e) { 
        console.error("Init Error:", e.message);
        res.status(500).json({ error: e.message }); 
    }
};

exports.getNMMSData = async (req, res) => {
    try {
        const { year, type } = req.query; 
        const formattedYear = year && year.includes("-") ? year.split("-")[0] : year;
        const data = await model.getNMMSReport(formattedYear, type);
        res.json(data);
    } catch (e) { 
        console.error("Data Fetch Error:", e.message);
        res.status(500).json({ error: e.message }); 
    }
};

exports.getTurnOutData = async (req, res) => {
    try {
        const { year, type } = req.query; 
        const formattedYear = year && year.includes("-") ? year.split("-")[0] : year;
        const data = await model.getTurnOutReport(formattedYear, type);
        res.json(data);
    } catch (e) { 
        console.error("TurnOut Data Fetch Error:", e.message);
        res.status(500).json({ error: e.message }); 
    }
};
// --- PDF HEADER UTILITY ---
const drawReportHeader = (doc, isFirstPage, nmmsYear) => {
    doc.save(); 
    const MARGIN_LEFT = 30;
    const PAGE_WIDTH = doc.page.width;
    const RIGHT_EDGE = PAGE_WIDTH - MARGIN_LEFT;
    const START_Y = MARGIN_LEFT;
    const LOGO_SIZE = 50;
    const MAIN_TITLE_FONT_SIZE = isFirstPage ? 18 : 12;

    if (fs.existsSync(PATH_TO_RCF_LOGO)) {
         doc.image(PATH_TO_RCF_LOGO, MARGIN_LEFT, START_Y, { fit: [LOGO_SIZE, LOGO_SIZE] });
    }
    if (fs.existsSync(PATH_TO_PP_LOGO)) {
         doc.image(PATH_TO_PP_LOGO, RIGHT_EDGE - LOGO_SIZE, START_Y, { fit: [LOGO_SIZE, LOGO_SIZE] });
    }
    
    doc.fillColor('#000000').font('Times-Bold').fontSize(MAIN_TITLE_FONT_SIZE)
        .text('RAJALAKSHMI CHILDREN FOUNDATION', MARGIN_LEFT, START_Y + 10, {
            align: 'center', width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });

    // "EXAMINATION" removed from the title
    doc.moveDown(0.3)
        .fontSize(isFirstPage ? 16 : 10)
        .text(`PRATIBHA POSHAK - ${nmmsYear}`, MARGIN_LEFT, doc.y, {
            align: 'center', width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });
        
    doc.moveDown(0.3).font('Times-Roman').fontSize(isFirstPage ? 8 : 7)
        .text('Kayaka Kranti Towers, CTS No. 4824C/23+24, Ayodhya Nagar, Near Kolhapur Circle, Belagavi 590016', {
            align: 'center', width: PAGE_WIDTH - 2 * MARGIN_LEFT
        });

    doc.moveDown(0.1).text('Contact No. +91 9444900755, +91 9606930208', {
        align: 'center', width: PAGE_WIDTH - 2 * MARGIN_LEFT
    });
    
    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.moveTo(MARGIN_LEFT, lineY).lineTo(RIGHT_EDGE, lineY).stroke();
    doc.restore();
    doc.y = lineY + 15; 
};

// --- MAIN DOWNLOAD FUNCTION ---
exports.downloadNMMSPDF = async (req, res) => {
    try {
        const { year, type, reportPayload } = req.body;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // --- DYNAMIC FILENAME LOGIC ---
        // Sets name to 'NMMS_Block_Report' or 'NMMS_District_Report' based on the selection
        const reportLabel = type === 'block' ? 'Block_Report' : 'District_Report';
        const fileName = `NMMS_${reportLabel}_${year}.pdf`;
        
        const filePath = path.join(GENERATED_FILES_ROOT, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);
        res.setHeader('Content-Type', 'application/pdf');
       res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);

        let isFirstPage = true;

        for (const item of reportPayload) {
            if (!isFirstPage) doc.addPage();
            
            drawReportHeader(doc, isFirstPage, year);
            
            const mainTitle = type === 'block' ? 'NMMS Report (by Block)' : 'NMMS Report (by District)';
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(mainTitle, { align: 'center' });
            doc.moveDown(1);

            if (type === 'block') {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(`District: ${item.districtName.toUpperCase()}`, { underline: true });
                doc.moveDown(1);
            }

            if (item.chartImage) {
                const imgData = item.chartImage.replace(/^data:image\/\w+;base64,/, "");
                const graphStartY = doc.y;

                doc.rect(40, graphStartY, 500, 280).fill('#ffffff'); 
                
                doc.image(Buffer.from(imgData, 'base64'), 45, graphStartY + 5, { 
                    width: 480,
                    height: 220, 
                    align: 'center' 
                });
                
                doc.y = graphStartY + 290; 
                doc.moveDown(1); 
            }

            const table = {
                headers: [
                    { label: type === 'district' ? "District Name" : "Block Name", property: 'label', width: 300 },
                    { label: "Applicant Count", property: 'count', width: 180 }
                ],
                rows: item.blocks.map(b => [b.label, (b.applicant_count || 0).toString()])
            };

            await doc.table(table, { 
                width: 480,
                x: 40,
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#475569'),
                prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor('#1e293b')
            });

            isFirstPage = false;
        }

        doc.end();
       // writeStream.on('finish', () => console.log(`Report successfully archived: ${filePath}`));

    } catch (e) {
        console.error("PDF Generation Error:", e);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

exports.downloadTurnOutPDF = async (req, res) => {
    try {
        const { year, type, reportPayload } = req.body;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        const reportLabel = type === 'block' ? 'Block_TurnOut' : 'District_TurnOut';
        const fileName = `NMMS_${reportLabel}_${year}_${Date.now()}.pdf`;

        // Archive copy
        const filePath = path.join(GENERATED_FILES_ROOT, fileName);
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);

        let isFirstPage = true;
        for (const item of reportPayload) {
            if (!isFirstPage) doc.addPage();
            drawReportHeader(doc, isFirstPage, year);

            const mainTitle = type === 'block' ? 'Test Turn-Out Report (by Block)' : 'Test Turn-Out Report (by District)';
            const subTitle = "(PP-Test appeared students as a percentage of called students)";
            
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(mainTitle, { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text(subTitle, { align: 'center' });
            doc.moveDown(1);

            if (type === 'block') {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(`District: ${item.districtName.toUpperCase()}`, { underline: true });
                doc.moveDown(1);
            }

            if (item.chartImage) {
                const imgData = item.chartImage.replace(/^data:image\/\w+;base64,/, "");
                const graphY = doc.y;
                doc.rect(40, graphY, 500, 260).fill('#ffffff'); 
                doc.image(Buffer.from(imgData, 'base64'), 45, graphY + 5, { width: 480, height: 220, align: 'center' });
                doc.y = graphY + 290; // Overlap Fix
            }

            const table = {
                headers: [
                    { label: type === 'district' ? "District" : "Block", property: 'label', width: 200 },
                    { label: "Called", property: 'called', width: 80 },
                    { label: "Appeared", property: 'appeared', width: 80 },
                    { label: "Turn-Out %", property: 'percentage', width: 100 }
                ],
                rows: item.blocks.map(b => [
                    b.label, 
                    (b.called_count || 0).toString(), 
                    (b.appeared_count || 0).toString(), 
                    `${b.turnout_percentage || 0}%`
                ])
            };

            await doc.table(table, { 
                width: 480, x: 40,
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#475569'),
                prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor('#1e293b')
            });
            isFirstPage = false;
        }
        doc.end();
    } catch (e) { 
        console.error("PDF Export Error:", e);
        res.status(500).send("Error generating Turn-Out PDF"); 
    }
};
// --- FETCH SELECTION DATA ---
exports.getSelectionData = async (req, res) => {
    try {
        const { year, type } = req.query; 
        // Handles year formats like "2025-26" or "2025"
        const formattedYear = year && year.includes("-") ? year.split("-")[0] : year;
        
        const data = await model.getSelectionReport(formattedYear, type);
        res.json(data);
    } catch (e) { 
        console.error("Selection Data Fetch Error:", e.message);
        res.status(500).json({ error: e.message }); 
    }
};

// --- DOWNLOAD SELECTION PDF ---
exports.downloadSelectionPDF = async (req, res) => {
    try {
        const { year, type, reportPayload } = req.body;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        const reportLabel = type === 'block' ? 'Block_Selection' : 'District_Selection';
        const fileName = `NMMS_${reportLabel}_${year}_${Date.now()}.pdf`;
        
        const filePath = path.join(GENERATED_FILES_ROOT, fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);

        let isFirstPage = true;

        for (const item of reportPayload) {
            if (!isFirstPage) doc.addPage();
            
            // 1. Branding Header
            drawReportHeader(doc, isFirstPage, year);
            
            // 2. Report Titles
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Selection Success Report', { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b')
               .text('(Percentage of appeared students successfully selected)', { align: 'center' });
            doc.moveDown(1);

            // 3. District Context for Block View
            if (type === 'block') {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(`District: ${item.districtName.toUpperCase()}`, { underline: true });
                doc.moveDown(1);
            }

            // 4. Graph Image (if you decide to capture the Bubble/Gauge visual from frontend)
            if (item.chartImage) {
                const imgData = item.chartImage.replace(/^data:image\/\w+;base64,/, "");
                const graphStartY = doc.y;
                doc.rect(40, graphStartY, 500, 260).fill('#ffffff'); 
                doc.image(Buffer.from(imgData, 'base64'), 45, graphStartY + 5, { 
                    width: 480, height: 220, align: 'center' 
                });
                doc.y = graphStartY + 290; // Overlap Prevention
                doc.moveDown(1); 
            }

            // 5. Success Data Table
            const table = {
                headers: [
                    { label: type === 'district' ? "District" : "Block", property: 'label', width: 200 },
                    { label: "Appeared", property: 'app', width: 90 },
                    { label: "Selected", property: 'sel', width: 90 },
                    { label: "Success %", property: 'pct', width: 100 }
                ],
                rows: item.blocks.map(b => [
                    b.label, 
                    (b.appeared_count || 0).toString(), 
                    (b.selected_count || 0).toString(), 
                    `${b.selection_percentage || 0}%`
                ])
            };

            await doc.table(table, { 
                width: 480, x: 40,
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#475569'),
                prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor('#1e293b')
            });

            isFirstPage = false;
        }

        doc.end();
      //  writeStream.on('finish', () => console.log(`Selection Report archived: ${filePath}`));

    } catch (e) {
        console.error("Selection PDF Error:", e);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};


exports.getSelectsData = async (req, res) => {
    try {
        const { year, type } = req.query; 
        const formattedYear = year && year.includes("-") ? year.split("-")[0] : year;
        const data = await model.getSelectsReport(formattedYear, type);
        res.json(data);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
};

exports.downloadSelectsPDF = async (req, res) => {
    try {
        const { year, type, reportPayload } = req.body;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        const reportLabel = type === 'block' ? 'Block_Selects' : 'District_Selects';
        const fileName = `NMMS_${reportLabel}_${year}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);

        let isFirstPage = true;
        for (const item of reportPayload) {
            if (!isFirstPage) doc.addPage();
            drawReportHeader(doc, isFirstPage, year);
            
            const mainTitle = type === 'block' ? 'Selects Report (by Block)' : 'Selects Report (by District)';
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(mainTitle, { align: 'center' });
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('(Gender-wise selection details)', { align: 'center' });
            doc.moveDown(1);

            if (type === 'block') {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(`District: ${item.districtName.toUpperCase()}`, { underline: true });
                doc.moveDown(0.5);
            }

            // ADD GRAPH RENDERING
            if (item.chartImage) {
                const imgData = item.chartImage.replace(/^data:image\/\w+;base64,/, "");
                const graphStartY = doc.y;

                // Create a white background for the graph segment
                doc.rect(40, graphStartY, 500, 260).fill('#ffffff'); 
                
                // Render the Chart Image
                doc.image(Buffer.from(imgData, 'base64'), 45, graphStartY + 5, { 
                    width: 480,
                    height: 220, 
                    align: 'center' 
                });
                
                doc.y = graphStartY + 280; // Move cursor below the graph
                doc.moveDown(1); 
            }

            // Table headers and rows for Selects
            // Updated to match your single-count logic
            const table = {
                headers: [
                    { label: "Location Name", property: 'label', width: 220 },
                    { label: "Boys Selected", property: 'boys', width: 130 },
                    { label: "Girls Selected", property: 'girls', width: 130 }
                ],
                rows: item.blocks.map(b => [
                    b.label, 
                    (b.boys_sel || 0).toString(), 
                    (b.girls_sel || 0).toString()
                ])
            };

            await doc.table(table, { 
                width: 480, x: 40,
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10).fillColor('#475569'),
                prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor('#1e293b')
            });
            isFirstPage = false;
        }
        doc.end();
    } catch (e) {
        console.error("PDF Export Error:", e.message);
        if (!res.headersSent) res.status(500).send("Error generating Selects PDF");
    }
};

// --- NEW EXPORTS FOR SAMMELAN ---

// Fetch cohort list for the frontend dropdown
exports.getCohorts = async (req, res) => {
    try {
        const data = await model.getCohorts();
        res.json(data);
    } catch (e) {
        console.error("Cohort Fetch Error:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Fetch Sammelan data based on cohort and date range
exports.getSammelanData = async (req, res) => {
    try {
        const { cohort, fromDate, toDate } = req.query;
        // Basic validation to prevent SQL errors
        if (!cohort || !fromDate || !toDate) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        const data = await model.getSammelanData(cohort, fromDate, toDate);
        res.json(data);
    } catch (e) {
        console.error("Sammelan Data Error:", e.message);
        res.status(500).json({ error: e.message });
    }
};

// Download Sammelan PDF with all jurisdictions and date fields
exports.downloadSammelanPDF = async (req, res) => {
    try {
        const { cohort, reportPayload } = req.body;
        // Switched to landscape to fit all the new columns nicely
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Sammelan_Report_${cohort}.pdf"`);
        doc.pipe(res);

        // Branding utility
        drawReportHeader(doc, true, cohort);
        doc.fontSize(16).font('Helvetica-Bold').text('Sammelan Attendance Report', { align: 'center' });
        doc.moveDown(1);

        const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '--';

        for (const item of reportPayload) {
            if (item.chartImage) {
                const imgData = item.chartImage.replace(/^data:image\/\w+;base64,/, "");
                doc.image(Buffer.from(imgData, 'base64'), 45, doc.y, { width: 700, height: 250 });
                doc.y += 270; 
            }

            const table = {
                headers: [
                    'Event Title', 
                    'District', 
                    'Block', 
                    'Location', 
                    'Start Date', 
                    'End Date', 
                    'Boys', 
                    'Girls',
                    'Total'
                ],
                rows: item.blocks.map(b => [
                    b.label || '', 
                    b.district_name || '',
                    b.block_name || '',
                    b.event_location || '', 
                    formatDate(b.from_date),
                    formatDate(b.to_date),
                    (b.boys_sel || 0).toString(), 
                    (b.girls_sel || 0).toString(),
                    ((b.boys_sel || 0) + (b.girls_sel || 0)).toString()
                ])
            };

            // Table width increased for landscape layout
            await doc.table(table, { 
                width: 780, 
                x: 30,
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(9)
            });
        }
        
        doc.end();
    } catch (e) { 
        console.error("Sammelan PDF Error:", e.message);
        res.status(500).send(e.message); 
    }
};