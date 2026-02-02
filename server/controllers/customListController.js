const path = require('path');
const fs = require('fs');
const model = require('../models/customListModel');
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PATH_TO_RCF_LOGO = path.join(PROJECT_ROOT, 'server', 'public', 'assets', 'rcf_logo-removebg-preview.png');
const PATH_TO_PP_LOGO = path.join(PROJECT_ROOT, 'server', 'public', 'assets', 'logo.png');

// --- Reusable Header for PDF ---
const drawReportHeader = (doc, isFirstPage, nmmsYear) => {
    doc.save(); 
    const MARGIN_LEFT = 30;
    const PAGE_WIDTH = doc.page.width;
    const RIGHT_EDGE = PAGE_WIDTH - MARGIN_LEFT;
    const START_Y = 20; 
    const LOGO_SIZE = 80; // 🔥 Increased Logo Size
    const MAIN_TITLE_FONT_SIZE = isFirstPage ? 18 : 12;

    if (fs.existsSync(PATH_TO_RCF_LOGO)) doc.image(PATH_TO_RCF_LOGO, MARGIN_LEFT, START_Y, { fit: [LOGO_SIZE, LOGO_SIZE] });
    if (fs.existsSync(PATH_TO_PP_LOGO)) doc.image(PATH_TO_PP_LOGO, RIGHT_EDGE - LOGO_SIZE, START_Y, { fit: [LOGO_SIZE, LOGO_SIZE] });
    
    doc.fillColor('#000000').font('Times-Bold').fontSize(MAIN_TITLE_FONT_SIZE)
        .text('RAJALAKSHMI CHILDREN FOUNDATION', MARGIN_LEFT, START_Y + 15, { align: 'center', width: PAGE_WIDTH - 2 * MARGIN_LEFT });
    
    // 🔥 Removed "EXAMINATION"
    doc.fontSize(isFirstPage ? 16 : 10).text(`PRATIBHA POSHAK - ${nmmsYear}`, { align: 'center' });
    
    doc.font('Times-Roman').fontSize(isFirstPage ? 8 : 7).text('Kayaka Kranti Towers, Belagavi 590016', { align: 'center' });
    doc.text('Contact No. +91 9444900755, +91 9606930208', { align: 'center' });
    
    const lineY = doc.y + 10;
    doc.moveTo(MARGIN_LEFT, lineY).lineTo(RIGHT_EDGE, lineY).lineWidth(1).strokeColor('#000000').stroke();
    doc.restore();
    return lineY + 10; 
};

// --- Standard Handlers ---
exports.getAllLists = async (req, res) => {
    try { res.json(await model.getAllLists()); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getAvailableFields = async (req, res) => {
    try { res.json(await model.getAvailableFields()); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getAllBatches = async (req, res) => {
    try {
        const { cohortId } = req.query; // Get from ?cohortId=1
        const batches = await model.getAllBatches(cohortId);
        res.json(batches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getStudentsByListId = async (req, res) => {
    try { res.json(await model.getStudentsByListId(req.params.listId)); } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.saveListFull = async (req, res) => {
    try {
        const { list_id, list_name, student_ids, selectedFields } = req.body;
        res.json(await model.saveListFull(list_id, list_name, student_ids, selectedFields));
    } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.deleteList = async (req, res) => {
    try { await model.deleteList(req.params.id); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
};



exports.getStudentsByCohort = async (req, res) => {
    try {
        const { cohortId } = req.params;
        const { batchId, stateId, districtId, blockId } = req.query; 

        const data = await model.getStudentsByCohort(
            cohortId, 
            batchId, 
            stateId, 
            districtId, 
            blockId
        );
        
        res.json(data);
    } catch (e) {
        console.error("Fetch Cohort Students Error:", e.message);
        res.status(500).json({ error: e.message });
    }
};

exports.downloadListPDF = async (req, res) => {
    const { listId } = req.params;
    try {
        const { students, fields } = await model.getStudentsByListId(listId);
        const listInfo = await model.getListHeader(listId);
        const listName = listInfo?.list_name || "Custom_List";

        const doc = new PDFDocument({ margins: { top: 20, bottom: 30, left: 30, right: 30 }, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${listName}.pdf"`);
        doc.pipe(res);

        const renderHeader = (pdfDoc, isFirst) => {
            const nextY = drawReportHeader(pdfDoc, isFirst, "2025");
            pdfDoc.y = nextY + 10;
            pdfDoc.fillColor('#0000FF').font('Times-Bold').fontSize(22).text(listName.toUpperCase(), { align: 'center' });
            pdfDoc.moveDown(1); 
        };

        renderHeader(doc, true);
        doc.on('pageAdded', () => renderHeader(doc, false));

        const tableRows = students.map(s => {
            let row = { student_id: String(s.student_id), student_name: s.student_name };
            fields.forEach(f => {
                let val = '-';
                // Use the same logic as your SQL CASE statement here
                if (f.col_name === 'batch_id') val = s.batch_name;
                else if (f.col_name === 'current_institute_dise_code') val = s.current_institute_name;
                else if (f.col_name === 'previous_institute_dise_code') val = s.previous_institute_name;
                else val = s[f.col_name]; 
                
                row[f.col_name] = String(val ?? '-');
            });
            return row;
        });

        const table = {
            headers: [
                { label: "ID", property: 'student_id', width: 50 },
                { label: "Name", property: 'student_name', width: 150 },
                // f.display_name here will now be "Active Status", "Enrollment Id", etc.
                ...fields.map(f => ({ label: f.display_name, property: f.col_name, width: 100 }))
            ],
            datas: tableRows
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Times-Bold").fontSize(10).fillColor('#000000'),
            prepareRow: () => doc.font("Times-Roman").fontSize(9).fillColor('#000000'),
        });
        doc.end();
    } catch (e) { res.status(500).send(e.message); }
};

exports.downloadListXLS = async (req, res) => {
    const { listId } = req.params;
    try {
        const { students, fields } = await model.getStudentsByListId(listId);
        const listHeader = await model.getListHeader(listId);
        const listName = listHeader?.list_name || "Custom_List";

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student List');

        const columns = [
            { header: 'Student ID', key: 'student_id', width: 15 },
            { header: 'Student Name', key: 'student_name', width: 30 },
            // Uses the updated display_name from your SQL query
            ...fields.map(f => ({ header: f.display_name, key: f.col_name, width: 25 }))
        ];
        worksheet.columns = columns;

        students.forEach(s => {
            let rowData = { student_id: s.student_id, student_name: s.student_name };
            fields.forEach(f => {
                let val = '-';
                if (f.col_name === 'batch_id') val = s.batch_name;
                else if (f.col_name === 'current_institute_dise_code') val = s.current_institute_name;
                else if (f.col_name === 'previous_institute_dise_code') val = s.previous_institute_name;
                else val = s[f.col_name];
                
                rowData[f.col_name] = val ?? '-';
            });
            worksheet.addRow(rowData);
        });

        worksheet.getRow(1).font = { bold: true };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${listName}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (e) { res.status(500).send(e.message); }
};