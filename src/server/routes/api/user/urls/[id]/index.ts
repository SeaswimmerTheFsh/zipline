import { hashPassword } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { Url } from '@/lib/db/models/url';
import { log } from '@/lib/logger';
import { userMiddleware } from '@/server/middleware/user';
import fastifyPlugin from 'fastify-plugin';

export type ApiUserUrlsIdResponse = Url;

type Params = {
  id: string;
};

const logger = log('api').c('user').c('urls').c('[id]');

export const PATH = '/api/user/urls/:id';
export default fastifyPlugin(
  (server, _, done) => {
    server.get<{ Params: Params }>(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const { id } = req.params;

      const url = await prisma.url.findFirst({
        where: {
          id: id,
        },
        omit: {
          password: true,
        },
      });

      if (!url) return res.notFound();
      if (url.userId !== req.user.id) return res.forbidden("You don't own this URL");

      return res.send(url);
    });

    server.patch<{ Body: Partial<Url>; Params: Params }>(
      PATH,
      { preHandler: [userMiddleware] },
      async (req, res) => {
        const { id } = req.params;

        const url = await prisma.url.findFirst({
          where: {
            id: id,
          },
        });

        if (!url) return res.notFound();
        if (url.userId !== req.user.id) return res.forbidden();

        let password: string | null | undefined = undefined;
        if (req.body.password !== undefined) {
          if (req.body.password === null || req.body.password === '') {
            password = null;
          } else if (typeof req.body.password === 'string') {
            password = await hashPassword(req.body.password);
          } else {
            return res.badRequest('password must be a string');
          }
        }

        if (req.body.vanity) {
          const existingUrl = await prisma.url.findFirst({
            where: {
              vanity: req.body.vanity,
            },
          });

          if (existingUrl) return res.badRequest('vanity already exists');
        }

        if (req.body.maxViews !== undefined && req.body.maxViews! < 0)
          return res.badRequest('maxViews must be >= 0');

        const updatedUrl = await prisma.url.update({
          where: {
            id: id,
          },
          data: {
            ...(req.body.vanity !== undefined && { vanity: req.body.vanity }),
            ...(req.body.password !== undefined && { password }),
            ...(req.body.maxViews !== undefined && { maxViews: req.body.maxViews }),
            ...(req.body.destination !== undefined && { destination: req.body.destination }),
          },
          omit: {
            password: true,
          },
        });

        logger.info(`${req.user.username} updated URL ${updatedUrl.id}`, {
          body: req.body,
        });

        return res.send(updatedUrl);
      },
    );

    server.delete<{ Params: Params }>(PATH, { preHandler: [userMiddleware] }, async (req, res) => {
      const { id } = req.params;

      const url = await prisma.url.findFirst({
        where: {
          id: id,
        },
      });

      if (!url) return res.notFound();
      if (url.userId !== req.user.id) return res.forbidden("You don't own this URL");

      const deletedUrl = await prisma.url.delete({
        where: {
          id: id,
        },
        omit: {
          password: true,
        },
      });

      return res.send(deletedUrl);
    });

    done();
  },
  { name: PATH },
);
