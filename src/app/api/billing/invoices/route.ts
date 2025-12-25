import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const userId = BigInt(session.user.id)
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '10')

  const total = await prisma.invoice.count({
    where: { userId }
  })

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { stripeCreated: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  })

  return NextResponse.json({
    data: invoices.map(inv => ({
      id: inv.id.toString(),
      number: inv.number,
      amount: Number(inv.total) / 100, // Convert from cents
      amountPaid: Number(inv.amountPaid) / 100,
      currency: inv.currency,
      status: inv.status,
      paidAt: inv.stripeCreated,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      invoiceUrl: inv.hostedInvoiceUrl,
      pdfUrl: inv.invoicePdf,
    })),
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    }
  })
}
