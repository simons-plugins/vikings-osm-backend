const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load environment variables
require('dotenv').config();

// Initialize Sentry BEFORE other imports
let Sentry;
try {
    Sentry = require('@sentry/node');
    const { ProfilingIntegration } = require('@sentry/profiling-node');
    
    // Initialize Sentry
    if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            integrations: [
                new Sentry.Integrations.Http({ tracing: true }),
                new Sentry.Integrations.Express({ app: express() }),
                new ProfilingIntegration(),
            ],
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            beforeSend(event, hint) {
                if (event.tags && event.tags.section === 'osm-api') {
                    event.contexts = {
                        ...event.contexts,
                        osm: {
                            rate_limit_info: event.extra?.rateLimitInfo || null,
                            endpoint: event.extra?.endpoint || null,
                        }
                    };
                }
                return event;
            }
        });
        console.log('✅ Sentry initialized for error monitoring');
    } else {
        console.log('⚠️  Sentry not initialized (missing SENTRY_DSN or test environment)');
    }
} catch (e) {
    console.log('⚠️  Sentry not available (package not installed)');
    Sentry = null;
}

module.exports = Sentry;