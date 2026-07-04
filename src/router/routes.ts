import type { RouteRecordRaw } from 'vue-router';

// Rotas da aplicação (hash mode): landing ('/') e gerador ('/gerador').
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/LandingPage.vue') },
      { path: 'gerador', component: () => import('@/pages/GeneratorPage.vue') },
    ],
  },

  // Sempre por último: rota de erro 404.
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
