const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Count in ad_analytics
    const adAnalyticsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ad_analytics WHERE eu_total_reach > 0`
    console.log('ad_analytics with eu_total_reach > 0:', adAnalyticsCount[0].count)
    
    // Count in facebook_ads
    const facebookAdsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM facebook_ads WHERE eu_total_reach > 0`
    console.log('facebook_ads with eu_total_reach > 0:', facebookAdsCount[0].count)
    
    // Count in fb_pages
    const fbPagesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM fb_pages WHERE eu_total_reach > 0`
    console.log('fb_pages with eu_total_reach > 0:', fbPagesCount[0].count)
    
    // Total ads
    const totalAds = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ads`
    console.log('Total ads:', totalAds[0].count)
    
    // Total ad_analytics
    const totalAnalytics = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ad_analytics`
    console.log('Total ad_analytics:', totalAnalytics[0].count)
    
    // Total facebook_ads
    const totalFbAds = await prisma.$queryRaw`SELECT COUNT(*) as count FROM facebook_ads`
    console.log('Total facebook_ads:', totalFbAds[0].count)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
