import { supabaseAdmin } from '../../../../../lib/supabase'
import { getClinicSession } from '../../../../../lib/clinic-auth'

function getISTDateString() {
    const now = new Date()
    const istTime = now.getTime() + (5.5 * 60 * 60 * 1000)
    const istDate = new Date(istTime)
    return istDate.toISOString().split('T')[0]
}

export async function GET(req) {
    try {
        const session = await getClinicSession()
        if (!session || !session.clinicId) {
            return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const clinicId = session.clinicId
        const today = getISTDateString()

        // 1. Total Collected
        const { data: collectedData } = await supabaseAdmin
            .from('patient_transactions')
            .select('amount')
            .eq('status', 'captured')
        // We need to filter transactions by clinic. If patient_transactions doesn't have clinic_id,
        // we might have to join or we assume we can add clinic_id. Actually, V2 patient_transactions usually has patient_entry_id.
        // Wait, does patient_transactions have clinic_id? Let's just query patient_entries for the clinic.

        // Let's get today's patient entries for the clinic
        const { data: entries } = await supabaseAdmin
            .from('patient_entries')
            .select('*')
            .eq('clinic_id', clinicId)
            .eq('entry_date', today)
            .order('joined_at', { ascending: false })
            
        const patientEntries = entries || []
        const entryIds = patientEntries.map(e => e.id)

        // Fetch transactions for these entries
        let transactions = []
        if (entryIds.length > 0) {
            const { data: txs } = await supabaseAdmin
                .from('patient_transactions')
                .select('*')
                .in('patient_entry_id', entryIds)
                .order('created_at', { ascending: false })
            transactions = txs || []
        }

        // Calculate exact total collected from transactions
        const totalCollected = transactions
            .filter(t => t.status === 'captured')
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

        // Calculate pending balance from entries
        const pendingBalance = patientEntries
            .filter(e => ['unpaid', 'partial'].includes(e.payment_status))
            .reduce((sum, e) => {
                // If it's partial, we need to subtract paid amounts. 
                // For simplicity as requested: "sum of payment_amount from patient_entries where payment_status IN ('unpaid','partial')"
                return sum + (parseFloat(e.payment_amount) || 0)
            }, 0)

        const recentTransactions = transactions.slice(0, 20)

        // Map V2 entries to V1 patients shape for the UI to continue working without JSX changes
        const mappedPatients = patientEntries.map(e => {
            const entryTxs = transactions.filter(t => t.patient_entry_id === e.id && t.status === 'captured')
            const paid = entryTxs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            
            return {
                ...e,
                fee_total: e.payment_amount,
                fee_paid: e.payment_status === 'completed' && paid === 0 ? e.payment_amount : paid, // fallback if no tx
            }
        })

        return Response.json({
            success: true,
            totalCollected,
            pendingBalance,
            recentTransactions,
            patients: mappedPatients // Legacy support for V1 UI
        }, { status: 200 })

    } catch (error) {
        console.error('[Clinic V2 Dashboard Payments API Error]', error)
        return Response.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
    }
}
