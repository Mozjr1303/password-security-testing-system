import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { authenticate, logAudit } from '../middleware/auth';
import {
  StructuredAssessmentReport,
  compileAssessmentReportPayload,
  generateCsvContent,
  generatePdfBuffer,
} from '../engines/reportEngine';

const router = Router();

router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { assessment_id, report_type = 'PDF' } = req.body;
    let targetAssessmentId = assessment_id as string | undefined;

    if (!targetAssessmentId) {
      const latest = await prisma.assessment.findFirst({
        orderBy: { created_at: 'desc' },
      });
      if (!latest) {
        res.status(400).json({ error: 'No assessment found to generate a report from.' });
        return;
      }
      targetAssessmentId = latest.id;
    }

    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const reportNumber = `PSTS-RPT-${new Date().getFullYear()}-${suffix}`;

    const structuredPayload = await compileAssessmentReportPayload(targetAssessmentId, reportNumber);

    const report = await prisma.report.create({
      data: {
        assessment_id: targetAssessmentId,
        report_number: reportNumber,
        report_type: String(report_type).toUpperCase(),
        file_path: `/api/reports/${reportNumber}/download`,
        summary_json: JSON.stringify(structuredPayload),
      },
      include: {
        assessment: { select: { assessment_name: true, assessment_type: true, overall_score: true, risk_classification: true } },
      },
    });

    await logAudit({
      userId: req.user!.id,
      activityType: 'SECURITY_REPORT_GENERATED',
      assessmentId: targetAssessmentId,
      status: 'SUCCESS',
      metadata: {
        report_id: report.id,
        report_number: reportNumber,
        report_type: report.report_type,
      },
    });

    res.status(201).json({
      report: {
        ...report,
        payload: structuredPayload,
      },
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: 'Failed to generate security assessment report.' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const typeFilter = req.query.assessment_type as string | undefined;
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;

    const reports = await prisma.report.findMany({
      orderBy: { generated_at: 'desc' },
      include: {
        assessment: {
          include: {
            user: { select: { id: true, full_name: true, email: true } },
          },
        },
      },
    });

    const filtered = reports.filter((r) => {
      if (typeFilter && typeFilter !== 'ALL' && r.assessment.assessment_type !== typeFilter) {
        return false;
      }
      if (fromDate) {
        const from = new Date(fromDate);
        if (!isNaN(from.getTime()) && r.generated_at < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (!isNaN(to.getTime()) && r.generated_at > to) return false;
      }
      return true;
    });

    res.json({
      reports: filtered.map((r) => ({
        id: r.id,
        assessment_id: r.assessment_id,
        report_number: r.report_number,
        report_type: r.report_type,
        generated_at: r.generated_at,
        assessment_name: r.assessment.assessment_name,
        assessment_type: r.assessment.assessment_type,
        overall_score: r.assessment.overall_score,
        risk_classification: r.assessment.risk_classification,
        researcher_name: r.assessment.user.full_name,
        user_id: r.assessment.user_id,
        payload: (() => {
          try {
            return JSON.parse(r.summary_json);
          } catch {
            return null;
          }
        })(),
      })),
    });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Failed to load assessment reports.' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: String(req.params.id) },
      include: { assessment: true },
    });

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    res.json({
      ...report,
      payload: JSON.parse(report.summary_json || '{}'),
    });
  } catch (err) {
    console.error('Get report by id error:', err);
    res.status(500).json({ error: 'Failed to load report details.' });
  }
});

router.get('/:id/download', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    let payload: StructuredAssessmentReport;
    try {
      payload = JSON.parse(report.summary_json);
    } catch {
      payload = await compileAssessmentReportPayload(report.assessment_id, report.report_number);
    }

    const format = String(req.query.format || report.report_type || 'PDF').toUpperCase();

    await logAudit({
      userId: req.user!.id,
      activityType: 'SECURITY_REPORT_DOWNLOADED',
      assessmentId: report.assessment_id,
      status: 'SUCCESS',
      metadata: { report_number: report.report_number, format },
    });

    if (format === 'CSV') {
      const csv = generateCsvContent(payload);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.report_number}.csv"`);
      res.send(csv);
      return;
    }

    const pdfBuffer = await generatePdfBuffer(payload);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.report_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Download report error:', err);
    res.status(500).json({ error: 'Failed to download report file.' });
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: String(req.params.id) },
      include: { assessment: true },
    });

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    if (report.assessment.user_id !== req.user!.id && req.user!.role_name !== 'Administrator') {
      res.status(403).json({ error: 'You can only delete your own generated reports.' });
      return;
    }

    await prisma.report.delete({ where: { id: report.id } });

    await logAudit({
      userId: req.user!.id,
      activityType: 'SECURITY_REPORT_DELETED',
      assessmentId: report.assessment_id,
      status: 'SUCCESS',
      metadata: { report_number: report.report_number },
    });

    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Failed to delete report.' });
  }
});

export default router;
