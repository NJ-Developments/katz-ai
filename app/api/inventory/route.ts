import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const [products, user] = await Promise.all([
      prisma.product.findMany({
        where: { storeId: payload.storeId },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, role: true }
      })
    ])

    return NextResponse.json({ 
      products: products.map(p => ({ ...p, price: Number(p.price) })),
      user 
    })
  } catch (error) {
    console.error('Inventory error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
