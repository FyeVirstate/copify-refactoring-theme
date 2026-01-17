const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Check if ads can join with facebook_ads via ad_archive_id
    const joinCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM ads a
      JOIN facebook_ads fa ON a.ad_archive_id = fa.ad_archive_id
      WHERE fa.eu_total_reach > 0
    `
    console.log('ads JOIN facebook_ads with eu_total_reach > 0:', joinCount[0].count)
    
    // Check ads that have matching facebook_ads
    const matchCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM ads a
      WHERE EXISTS (SELECT 1 FROM facebook_ads fa WHERE fa.ad_archive_id = a.ad_archive_id)
    `
    console.log('ads with matching facebook_ads:', matchCount[0].count)
    
    // Sample some ads with EU data
    const sample = await prisma.$queryRaw`
      SELECT a.id, a.ad_archive_id, a.page_name, fa.eu_total_reach
      FROM ads a
      JOIN facebook_ads fa ON a.ad_archive_id = fa.ad_archive_id
      WHERE fa.eu_total_reach > 0
      LIMIT 5
    `
    console.log('Sample ads with EU data:', sample)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
