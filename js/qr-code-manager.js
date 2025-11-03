/**
 * QR Code Management Module
 * Handles QR code generation, storage, and retrieval from Supabase
 */

// ============================================
// CONFIGURATION - UPDATE THIS FOR PRODUCTION
// ============================================
const QR_CONFIG = {
    // Set your production URL here when deploying
    // Examples:
    // - 'https://your-site.netlify.app'
    // - 'https://your-domain.com'
    // - 'https://yourusername.github.io/sarawak-food-court'
    PRODUCTION_URL: 'https://sarawak-order.netlify.app', // ⚠️ Your deployed Netlify URL (NO trailing slash)
    
    // Auto-detect environment (production if deployed, localhost for testing)
    USE_AUTO_DETECT: true
};

class QRCodeManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }
    
    /**
     * Get the base URL for QR codes
     * @returns {string} Base URL (production or localhost)
     */
    getBaseURL() {
        if (QR_CONFIG.USE_AUTO_DETECT) {
            // Auto-detect: if hostname is localhost/127.0.0.1/0.0.0.0, use config, otherwise use current origin
            const isDevelopment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' || 
                                 window.location.hostname === '0.0.0.0' ||
                                 window.location.hostname.startsWith('192.168.') ||
                                 window.location.hostname.startsWith('10.') ||
                                 window.location.port !== '';
            
            if (isDevelopment) {
                // In development - check if production URL is set
                if (QR_CONFIG.PRODUCTION_URL && !QR_CONFIG.PRODUCTION_URL.includes('localhost')) {
                    console.log('🌐 Using configured production URL for QR codes:', QR_CONFIG.PRODUCTION_URL);
                    return QR_CONFIG.PRODUCTION_URL;
                }
                console.log('💻 Using localhost for QR codes (development mode)');
                return window.location.origin;
            }
            // Already on production - use current URL
            console.log('🚀 Using production URL for QR codes:', window.location.origin);
            return window.location.origin;
        }
        
        // Manual mode - always use configured URL
        return QR_CONFIG.PRODUCTION_URL;
    }

    /**
     * Get QR code for a specific table in a food court
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} tableNumber - Table number
     * @returns {Promise<Object|null>} QR code data or null if not found
     */
    async getQRCode(foodCourtId, tableNumber) {
        try {
            const { data, error } = await this.supabase
                .from('qr_codes')
                .select('*')
                .eq('food_court_id', foodCourtId)
                .eq('table_number', tableNumber)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching QR code:', error);
            throw error;
        }
    }

    /**
     * Get all QR codes for a food court
     * @param {string} foodCourtId - UUID of the food court
     * @returns {Promise<Array>} Array of QR code data
     */
    async getQRCodesByFoodCourt(foodCourtId) {
        try {
            const { data, error } = await this.supabase
                .from('qr_codes')
                .select('*')
                .eq('food_court_id', foodCourtId)
                .order('table_number', { ascending: true });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching QR codes:', error);
            throw error;
        }
    }

    /**
     * Generate menu URL for a table
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} tableNumber - Table number
     * @returns {string} Menu URL (points to home page showing all stalls)
     */
    generateMenuURL(foodCourtId, tableNumber) {
        const baseUrl = this.getBaseURL();
        // For production, construct path directly
        // For localhost, calculate relative path
        let path;
        
        if (baseUrl === window.location.origin) {
            // Development mode - use relative path
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
            path = `${basePath}/../customer/home.html`;
        } else {
            // Production mode - use absolute path
            path = '/customer/home.html';
        }
        
        // Customer scans QR → lands on home.html with table number
        // They can then browse all stalls in the food court
        return `${baseUrl}${path}?foodcourt=${foodCourtId}&table=${tableNumber}`;
    }

    /**
     * Generate QR code URL using API
     * @param {string} dataUrl - The URL to encode in the QR code
     * @param {number} size - Size of QR code (default: 300)
     * @returns {string} QR code image URL
     */
    generateQRCodeURL(dataUrl, size = 300) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(dataUrl)}`;
    }

    /**
     * Create or get QR code for a table
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} tableNumber - Table number
     * @returns {Promise<Object>} QR code data with isNew flag
     */
    async getOrCreateQRCode(foodCourtId, tableNumber) {
        try {
            // Check if QR code exists
            let qrCode = await this.getQRCode(foodCourtId, tableNumber);

            if (qrCode) {
                console.log('✅ QR code found in database:', qrCode);
                return {
                    ...qrCode,
                    isNew: false
                };
            }

            // Generate new QR code
            const menuUrl = this.generateMenuURL(foodCourtId, tableNumber);
            const qrCodeUrl = this.generateQRCodeURL(menuUrl);

            // Save to database
            const { data, error } = await this.supabase
                .from('qr_codes')
                .insert([{
                    food_court_id: foodCourtId,
                    table_number: parseInt(tableNumber),
                    qr_code_url: qrCodeUrl,
                    menu_url: menuUrl
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ New QR code created and saved:', data);
            return {
                ...data,
                isNew: true
            };
        } catch (error) {
            console.error('Error creating QR code:', error);
            throw error;
        }
    }

    /**
     * Batch generate QR codes for multiple tables
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} startTable - Starting table number
     * @param {number} endTable - Ending table number
     * @returns {Promise<Object>} Summary of created QR codes
     */
    async batchGenerateQRCodes(foodCourtId, startTable, endTable) {
        try {
            const qrCodes = [];
            let newCount = 0;
            let existingCount = 0;

            for (let tableNumber = startTable; tableNumber <= endTable; tableNumber++) {
                const result = await this.getOrCreateQRCode(foodCourtId, tableNumber);
                qrCodes.push(result);
                
                if (result.isNew) {
                    newCount++;
                } else {
                    existingCount++;
                }
            }

            return {
                success: true,
                total: qrCodes.length,
                newCount,
                existingCount,
                qrCodes
            };
        } catch (error) {
            console.error('Error batch generating QR codes:', error);
            throw error;
        }
    }

    /**
     * Delete QR code for a specific table
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} tableNumber - Table number
     * @returns {Promise<boolean>} Success status
     */
    async deleteQRCode(foodCourtId, tableNumber) {
        try {
            const { error } = await this.supabase
                .from('qr_codes')
                .delete()
                .eq('food_court_id', foodCourtId)
                .eq('table_number', tableNumber);

            if (error) throw error;

            console.log('✅ QR code deleted:', { foodCourtId, tableNumber });
            return true;
        } catch (error) {
            console.error('Error deleting QR code:', error);
            throw error;
        }
    }

    /**
     * Delete all QR codes for a food court
     * @param {string} foodCourtId - UUID of the food court
     * @returns {Promise<boolean>} Success status
     */
    async deleteAllQRCodes(foodCourtId) {
        try {
            const { error } = await this.supabase
                .from('qr_codes')
                .delete()
                .eq('food_court_id', foodCourtId);

            if (error) throw error;

            console.log('✅ All QR codes deleted for food court:', foodCourtId);
            return true;
        } catch (error) {
            console.error('Error deleting QR codes:', error);
            throw error;
        }
    }

    /**
     * Update QR code (regenerate if URL structure changes)
     * @param {string} foodCourtId - UUID of the food court
     * @param {number} tableNumber - Table number
     * @returns {Promise<Object>} Updated QR code data
     */
    async updateQRCode(foodCourtId, tableNumber) {
        try {
            const menuUrl = this.generateMenuURL(foodCourtId, tableNumber);
            const qrCodeUrl = this.generateQRCodeURL(menuUrl);

            const { data, error } = await this.supabase
                .from('qr_codes')
                .update({
                    qr_code_url: qrCodeUrl,
                    menu_url: menuUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('food_court_id', foodCourtId)
                .eq('table_number', tableNumber)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ QR code updated:', data);
            return data;
        } catch (error) {
            console.error('Error updating QR code:', error);
            throw error;
        }
    }

    /**
     * Download QR code as PNG
     * @param {string} qrCodeUrl - URL of the QR code image
     * @param {string} foodCourtName - Name of the food court
     * @param {number} tableNumber - Table number
     */
    downloadQRCode(qrCodeUrl, foodCourtName, tableNumber) {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        const sanitizedName = foodCourtName.replace(/\s+/g, '_');
        link.download = `QR_${sanitizedName}_Table_${tableNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Print QR code with food court and table details
     * @param {string} qrCodeUrl - URL of the QR code image
     * @param {string} foodCourtName - Name of the food court
     * @param {number} tableNumber - Table number
     */
    printQRCode(qrCodeUrl, foodCourtName, tableNumber) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${foodCourtName} - Table ${tableNumber}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    h1 {
                        color: #FF6B35;
                        margin-bottom: 10px;
                    }
                    h2 {
                        color: #2C3E50;
                        margin-bottom: 20px;
                    }
                    img {
                        margin: 20px 0;
                        border: 2px solid #E0E0E0;
                        padding: 10px;
                        border-radius: 12px;
                    }
                    .info {
                        margin-top: 20px;
                        font-size: 18px;
                        color: #666;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Sarawak Food Court</h1>
                <h2>${foodCourtName}</h2>
                <img src="${qrCodeUrl}" alt="QR Code">
                <div class="info">
                    <p><strong>Table Number: ${tableNumber}</strong></p>
                    <p>Scan to view menu and place orders</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        
        // Print after image loads
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCodeManager;
}
