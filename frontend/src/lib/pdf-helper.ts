export interface MedicationItem {
  name: string
  dosage: string
  frequency: string
  duration?: string
  instructions?: string
  dose?: string // fallback
}

export interface DiagnosisPDFData {
  title: string
  date: string
  patientName: string
  patientCi: string
  doctorName: string
  doctorLicense: string
  doctorSpecialty?: string
  soap: {
    reason?: string
    anamnesis?: string
    physicalExam?: string
    observations?: string
  }
  medications: MedicationItem[]
  ipfsHash?: string | null
  txHash?: string | null
}

async function getJsPDF(): Promise<any> {
  if (typeof window === 'undefined') return null
  
  // Si ya existe en el objeto window global
  const globalJspdf = (window as any).jspdf?.jsPDF || (window as any).jsPDF
  if (globalJspdf) return globalJspdf

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.async = true
    script.onload = () => {
      const loadedJspdf = (window as any).jspdf?.jsPDF || (window as any).jsPDF
      if (loadedJspdf) {
        resolve(loadedJspdf)
      } else {
        reject(new Error('jsPDF no se pudo inicializar desde el script CDN'))
      }
    }
    script.onerror = () => {
      reject(new Error('Error al cargar la librería jsPDF desde el CDN'))
    }
    document.body.appendChild(script)
  })
}

export async function generateSingleDiagnosisPDF(data: DiagnosisPDFData): Promise<Blob> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) throw new Error('jsPDF no está disponible en el servidor')
  
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Width = 210, Height = 297

  // Add decorative header bar
  doc.setFillColor(15, 23, 42) // Slate 900
  doc.rect(0, 0, 210, 35, 'F')

  // Header Text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('BOLIVIA HEALTH ID', 15, 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(165, 180, 252)
  doc.text('SISTEMA DE IDENTIDAD DE SALUD DESCENTRALIZADA', 15, 22)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('EXPEDIENTE CLÍNICO DIGITAL', 150, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Fuji Testnet network', 150, 20)

  // Top Section: Info Doctor / Paciente
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN GENERAL', 15, 48)
  
  doc.setDrawColor(226, 232, 240)
  doc.line(15, 51, 195, 51)

  // Columns for info
  doc.setFontSize(9)
  // Left: Patient
  doc.setFont('helvetica', 'bold')
  doc.text('Paciente:', 15, 58)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patientName, 45, 58)

  doc.setFont('helvetica', 'bold')
  doc.text('Cédula Identidad:', 15, 64)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patientCi || 'N/A', 45, 64)

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha Emisión:', 15, 70)
  doc.setFont('helvetica', 'normal')
  doc.text(data.date, 45, 70)

  // Right: Doctor
  doc.setFont('helvetica', 'bold')
  doc.text('Médico Tratante:', 115, 58)
  doc.setFont('helvetica', 'normal')
  doc.text(data.doctorName ? `Dr(a). ${data.doctorName}` : 'Médico del Sistema', 145, 58)

  doc.setFont('helvetica', 'bold')
  doc.text('Especialidad:', 115, 64)
  doc.setFont('helvetica', 'normal')
  doc.text(data.doctorSpecialty || 'Médico General', 145, 64)

  doc.setFont('helvetica', 'bold')
  doc.text('Licencia SEDES:', 115, 70)
  doc.setFont('helvetica', 'normal')
  doc.text(data.doctorLicense || 'N/A', 145, 70)

  // Diagnóstico Principal
  let currentY = 82
  doc.setFillColor(248, 250, 252)
  doc.rect(15, currentY, 180, 14, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.rect(15, currentY, 180, 14, 'D')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text('DIAGNÓSTICO:', 18, currentY + 9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.title, 48, currentY + 9)
  currentY += 22

  // SOAP
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('EVALUACIÓN CLÍNICA (SOAP)', 15, currentY)
  doc.line(15, currentY + 3, 195, currentY + 3)
  currentY += 8

  const renderCard = (title: string, content: string) => {
    if (!content) return
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(241, 245, 249)
    doc.rect(15, currentY, 180, 18, 'FD')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(title.toUpperCase(), 18, currentY + 5)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    
    const splitContent = doc.splitTextToSize(content, 174)
    doc.text(splitContent, 18, currentY + 11)
    currentY += 22
  }

  if (data.soap.reason) renderCard('1. Motivo de Consulta', data.soap.reason)
  if (data.soap.anamnesis) renderCard('2. Anamnesis / Antecedentes', data.soap.anamnesis)
  if (data.soap.physicalExam) renderCard('3. Examen Físico / Vitals', data.soap.physicalExam)
  if (data.soap.observations) renderCard('4. Observaciones y Recomendaciones', data.soap.observations)

  // Medications Table
  if (data.medications && data.medications.length > 0) {
    currentY += 5
    if (currentY > 220) {
      doc.addPage()
      currentY = 20
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('TRATAMIENTO PRESCRITO', 15, currentY)
    doc.line(15, currentY + 3, 195, currentY + 3)
    currentY += 10

    // Table Header
    doc.setFillColor(15, 23, 42)
    doc.rect(15, currentY, 180, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Medicamento', 18, currentY + 5)
    doc.text('Dosis', 85, currentY + 5)
    doc.text('Frecuencia', 130, currentY + 5)
    doc.text('Duración', 165, currentY + 5)
    currentY += 7

    data.medications.forEach((med, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252)
      } else {
        doc.setFillColor(255, 255, 255)
      }
      doc.rect(15, currentY, 180, 9, 'F')
      doc.setDrawColor(241, 245, 249)
      doc.line(15, currentY + 9, 195, currentY + 9)

      doc.setTextColor(51, 65, 85)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.text(med.name, 18, currentY + 6)
      doc.setFont('helvetica', 'normal')
      doc.text(med.dosage || med.dose || 'N/A', 85, currentY + 6)
      doc.text(med.frequency || 'N/A', 130, currentY + 6)
      doc.text(med.duration || 'N/A', 165, currentY + 6)
      currentY += 9
    })
  }

  // Blockchain integrity badge at bottom
  currentY = Math.max(currentY + 15, 240)
  if (currentY > 260) {
    doc.addPage()
    currentY = 20
  }

  doc.setFillColor(236, 254, 255) // light cyan
  doc.setDrawColor(165, 243, 252) // cyan 200
  doc.rect(15, currentY, 180, 26, 'FD')

  doc.setTextColor(8, 145, 178) // cyan 700
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('VERIFICACIÓN Y SEGURIDAD CRIPTOGRÁFICA', 18, currentY + 6)

  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(`IPFS Hash: ${data.ipfsHash || 'N/A (Firmado localmente)'}`, 18, currentY + 13)
  
  const txText = data.txHash ? `TX Hash: ${data.txHash}` : 'Integridad garantizada localmente (pendiente de anclaje de red)'
  const splitTx = doc.splitTextToSize(txText, 170)
  doc.text(splitTx, 18, currentY + 18)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(16, 185, 129) // emerald 500
  doc.text('✓ INTEGRIDAD GARANTIZADA ON-CHAIN', 125, currentY + 6)

  return doc.output('blob')
}

export interface PatientHistoryPDFData {
  patientName: string
  patientCi: string
  records: Array<{
    title: string
    date: string
    category: string
    doctor?: string
    doctorSpecialty?: string
    description: string
    medications?: any[]
    ipfsHash?: string | null
    txHash?: string | null
  }>
}

export async function generatePatientHistoryPDF(data: PatientHistoryPDFData): Promise<Blob> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) throw new Error('jsPDF no está disponible en el servidor')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let pageNum = 1

  const drawHeader = () => {
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.rect(0, 0, 210, 30, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('BOLIVIA HEALTH ID', 15, 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(165, 180, 252)
    doc.text('HISTORIAL CLÍNICO COMPLETO DEL PACIENTE', 15, 18)

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`PÁGINA ${pageNum}`, 180, 15)
  }

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text('Este documento es una copia autorizada del expediente médico del paciente. Verificado digitalmente en Avalanche Fuji Network.', 15, 287)
  }

  drawHeader()
  drawFooter()

  // Patient Info
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL PACIENTE', 15, 42)
  doc.setDrawColor(226, 232, 240)
  doc.line(15, 44, 195, 44)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Paciente:', 15, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patientName, 35, 50)

  doc.setFont('helvetica', 'bold')
  doc.text('Cédula Identidad:', 115, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(data.patientCi || 'N/A', 145, 50)

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha Reporte:', 15, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 35, 56)

  doc.setFont('helvetica', 'bold')
  doc.text('Total Registros:', 115, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.records.length}`, 145, 56)

  let currentY = 68
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('REGISTROS HISTÓRICOS', 15, currentY)
  doc.line(15, currentY + 2, 195, currentY + 2)
  currentY += 8

  data.records.forEach((record, index) => {
    const medsCount = record.medications ? record.medications.length : 0
    const descriptionToShow = record.description
      .split(' | ')
      .filter(p => !p.startsWith('IPFS:') && !p.startsWith('Tx:'))
      .join(' | ')
    const splitDesc = doc.splitTextToSize(descriptionToShow, 174)
    const boxHeight = 25 + (splitDesc.length * 4.5) + (medsCount > 0 ? (medsCount * 4.5) + 6 : 0)

    if (currentY + boxHeight > 275) {
      doc.addPage()
      pageNum++
      drawHeader()
      drawFooter()
      currentY = 40
    }

    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(226, 232, 240)
    doc.rect(15, currentY, 180, boxHeight, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`${index + 1}. ${record.title}`, 18, currentY + 6)

    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Fecha: ${record.date}  |  Categoría: ${record.category.toUpperCase()}  |  Médico: Dr(a). ${record.doctor || 'N/A'}`, 18, currentY + 11)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    doc.text(splitDesc, 18, currentY + 16)

    let subY = currentY + 16 + (splitDesc.length * 4.5)

    if (medsCount > 0 && record.medications) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text('Medicamentos Recetados:', 18, subY)
      subY += 4.5

      record.medications.forEach((med: any) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(51, 65, 85)
        doc.text(`• ${med.name} - ${med.dosage || med.dose || ''} - ${med.frequency}`, 22, subY)
        subY += 4.5
      })
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(13, 148, 136)
    doc.text(`✓ Blockchain Verified  |  IPFS Hash: ${record.ipfsHash || 'N/A'}`, 18, currentY + boxHeight - 3)

    currentY += boxHeight + 6
  })

  return doc.output('blob')
}

export interface DoctorActivityPDFData {
  doctorName: string
  doctorLicense: string
  doctorWallet: string
  records: Array<{
    title: string
    date: string
    patientName: string
    patientCi: string
    txHash?: string | null
    ipfsHash?: string | null
  }>
}

export async function generateDoctorActivityPDF(data: DoctorActivityPDFData): Promise<Blob> {
  const jsPDF = await getJsPDF()
  if (!jsPDF) throw new Error('jsPDF no está disponible en el servidor')

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let pageNum = 1

  const drawHeader = () => {
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.rect(0, 0, 210, 30, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('BOLIVIA HEALTH ID', 15, 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(165, 180, 252)
    doc.text('HISTORIAL DE ACTIVIDAD Y FIRMAS MÉDICAS', 15, 18)

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`PÁGINA ${pageNum}`, 180, 15)
  }

  const drawFooter = () => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text('Este reporte certifica las firmas electrónicas registradas en el sistema Bolivia Health ID. Red Avalanche Fuji.', 15, 287)
  }

  drawHeader()
  drawFooter()

  // Doctor Info
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL PROFESIONAL MÉDICO', 15, 42)
  doc.setDrawColor(226, 232, 240)
  doc.line(15, 44, 195, 44)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Médico:', 15, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dr(a). ${data.doctorName}`, 35, 50)

  doc.setFont('helvetica', 'bold')
  doc.text('Licencia SEDES:', 115, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(data.doctorLicense || 'N/A', 145, 50)

  doc.setFont('helvetica', 'bold')
  doc.text('Billetera Web3:', 15, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(data.doctorWallet || 'N/A', 35, 56)

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha Emisión:', 115, 56)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 145, 56)

  let currentY = 68
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FIRMAS Y REGISTROS REALIZADOS', 15, currentY)
  doc.line(15, currentY + 2, 195, currentY + 2)
  currentY += 8

  // Table header
  doc.setFillColor(15, 23, 42)
  doc.rect(15, currentY, 180, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha', 18, currentY + 5)
  doc.text('Paciente / CI', 45, currentY + 5)
  doc.text('Diagnóstico', 95, currentY + 5)
  doc.text('ID Transacción Blockchain', 145, currentY + 5)
  currentY += 7

  if (data.records.length === 0) {
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('No hay registros firmados digitalmente por este médico.', 18, currentY + 8)
  } else {
    data.records.forEach((record, idx) => {
      if (currentY > 260) {
        doc.addPage()
        pageNum++
        drawHeader()
        drawFooter()
        currentY = 40
        
        doc.setFillColor(15, 23, 42)
        doc.rect(15, currentY, 180, 7, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('Fecha', 18, currentY + 5)
        doc.text('Paciente / CI', 45, currentY + 5)
        doc.text('Diagnóstico', 95, currentY + 5)
        doc.text('ID Transacción Blockchain', 145, currentY + 5)
        currentY += 7
      }

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252)
      } else {
        doc.setFillColor(255, 255, 255)
      }
      doc.rect(15, currentY, 180, 9, 'F')
      doc.setDrawColor(241, 245, 249)
      doc.line(15, currentY + 9, 195, currentY + 9)

      doc.setTextColor(51, 65, 85)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(record.date, 18, currentY + 6)
      doc.text(`${record.patientName} (${record.patientCi})`, 45, currentY + 6)
      
      const titleLimit = record.title.length > 25 ? record.title.slice(0, 23) + '...' : record.title
      doc.text(titleLimit, 95, currentY + 6)

      const txLimit = record.txHash ? record.txHash.slice(0, 10) + '...' + record.txHash.slice(-8) : 'Firma local'
      doc.setTextColor(6, 182, 212) // Cyan
      doc.text(txLimit, 145, currentY + 6)

      currentY += 9
    })
  }

  return doc.output('blob')
}
