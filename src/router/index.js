import { createRouter, createWebHashHistory  } from 'vue-router'
import   bridge   from "../views/bridge/index.vue"

import     nft    from "../views/nftBridge/index.vue"
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'bridge',
      component: bridge,
    },

    

    {
      path: '/nft',
      name: 'nftBridge1',
      component:  nft ,
    },

  ],
  scrollBehavior(to, from, savedPosition) {
    // 处理滚动行为：如果有保存的滚动位置，则恢复到该位置，否则滚动到顶部
  
      return { top: 0 }; // 跳转时滚动到顶部
    
  },
});
export default router
