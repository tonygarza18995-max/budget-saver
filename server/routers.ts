import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  getOrCreateCustomer,
  createEphemeralKey,
  getSubscriptionDetails,
} from "./stripe";
import { addToWaitlist, getWaitlistCount, submitBugReport, getBugReports } from "./db";
import { notifyOwner } from "./_core/notification";
import { emailWaitlistNotification, emailBugReportNotification } from "./email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Waitlist routes — collect emails from interested users
  waitlist: router({
    join: publicProcedure
      .input(
        z.object({
          email: z.string().email("Please enter a valid email address"),
        })
      )
      .mutation(async ({ input }) => {
        const result = await addToWaitlist(input.email);
        // Notify owner of new waitlist signup (only for new signups, not duplicates)
        if (result.success && !result.message.includes("already")) {
          try {
            const count = await getWaitlistCount();
            await notifyOwner({
              title: "New Waitlist Signup!",
              content: `${input.email} just joined the waitlist!\nTotal waitlist signups: ${count}`,
            });
            // Send real email notification to owner's Gmail
            await emailWaitlistNotification(input.email, count);
          } catch (notifyErr) {
            // Non-blocking — signup is already saved to DB
            console.warn("[Waitlist] Owner notification failed:", notifyErr);
          }
        }
        return result;
      }),

    count: publicProcedure.query(async () => {
      const count = await getWaitlistCount();
      return { count };
    }),
  }),

  // Bug report routes — public so anyone can submit
  bugReport: router({
    submit: publicProcedure
      .input(
        z.object({
          description: z.string().min(5, "Please describe the bug in at least 5 characters").max(2000),
          screen: z.string().max(255).optional(),
          platform: z.string().max(50).optional(),
          email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
        })
      )
      .mutation(async ({ input }) => {
        // Clean up empty email
        const cleanEmail = input.email && input.email.trim() !== "" ? input.email : undefined;
        
        const result = await submitBugReport({
          description: input.description,
          screen: input.screen,
          platform: input.platform,
          email: cleanEmail,
        });

        // Notify the owner about the new bug report
        try {
          const emailLine = cleanEmail ? `\nContact: ${cleanEmail}` : "";
          const screenLine = input.screen ? `\nScreen: ${input.screen}` : "";
          const platformLine = input.platform ? `\nPlatform: ${input.platform}` : "";
          await notifyOwner({
            title: "New Bug Report Submitted",
            content: `${input.description}${screenLine}${platformLine}${emailLine}`,
          });
          // Send real email notification to owner's Gmail
          await emailBugReportNotification({
            description: input.description,
            screen: input.screen,
            platform: input.platform,
            email: cleanEmail,
          });
        } catch (notifyErr) {
          // Non-blocking — bug report is already saved to DB
          console.warn("[BugReport] Failed to notify owner:", notifyErr);
        }

        return result;
      }),

    list: publicProcedure.query(async () => {
      return getBugReports();
    }),
  }),

  // Stripe payment routes (public — no auth required for local-first app)
  payments: router({
    /**
     * Create a payment intent for a one-time payment.
     * Used for simple "pay what you want" charges.
     */
    createPaymentIntent: publicProcedure
      .input(
        z.object({
          amount: z.number().min(1, "Minimum amount is $1"),
          currency: z.string().default("usd"),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createPaymentIntent(input.amount, input.currency, {
          type: "subscription",
        });
        return result;
      }),

    /**
     * Initialize the payment sheet — creates a customer, ephemeral key, and payment intent.
     * This is the recommended flow for mobile Stripe Payment Sheet.
     */
    createPaymentSheet: publicProcedure
      .input(
        z.object({
          amount: z.number().min(1, "Minimum amount is $1"),
          email: z.string().email().optional(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Create or retrieve customer
        const customerId = await getOrCreateCustomer(
          input.email,
          input.name,
          { source: "budget_saver" }
        );

        // Create ephemeral key for the customer
        const ephemeralKey = await createEphemeralKey(customerId);

        // Create payment intent
        const { clientSecret, paymentIntentId } = await createPaymentIntent(
          input.amount,
          "usd",
          { customerId, type: "subscription" }
        );

        return {
          clientSecret,
          ephemeralKey,
          customerId,
          paymentIntentId,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
        };
      }),

    /**
     * Create a recurring subscription with Stripe Billing.
     */
    createSubscription: publicProcedure
      .input(
        z.object({
          amount: z.number().min(1, "Minimum amount is $1"),
          interval: z.enum(["month", "year"]).default("month"),
          email: z.string().email().optional(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const customerId = await getOrCreateCustomer(
          input.email,
          input.name,
          { source: "budget_saver" }
        );

        const result = await createSubscription(
          customerId,
          input.amount,
          input.interval,
          { type: "budget_saver_subscription" }
        );

        return {
          ...result,
          customerId,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
        };
      }),

    /**
     * Cancel an active subscription.
     */
    cancelSubscription: publicProcedure
      .input(
        z.object({
          subscriptionId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await cancelSubscription(input.subscriptionId);
        return result;
      }),

    /**
     * Get subscription details.
     */
    getSubscription: publicProcedure
      .input(
        z.object({
          subscriptionId: z.string(),
        })
      )
      .query(async ({ input }) => {
        const result = await getSubscriptionDetails(input.subscriptionId);
        return result;
      }),

    /**
     * Get the Stripe publishable key for client-side initialization.
     */
    getPublishableKey: publicProcedure.query(() => {
      return {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
