export default {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
  dynamicRoutes: {
    '/dates/payment-confirmation/[dateId]': { dynamic: true },
    '/dates/payment-confirmation/[dateId]/[paymentId]': { dynamic: true },
    '/dates/upcoming/[dateId]': { dynamic: true },
    '/dates/upcoming/[dateId]/rate': { dynamic: true },
    '/dates/upcoming/[dateId]/messaging': { dynamic: true },
    '/dates/upcoming/[dateId]/second-date': { dynamic: true },
    '/api/tickets/[dateId]/download': { dynamic: true },
    '/api/payments/[id]': { dynamic: true },
    '/profile/[id]': { dynamic: true },
    '/send-date-request/[id]': { dynamic: true },
    '/challenges/[id]': { dynamic: true },
    '/challenges/[id]/comments': { dynamic: true }
  }
} 