import { basekit, FieldType, FieldComponent, FieldCode } from '@lark-opdev/block-basekit-server-api';

const VERSION = '1.1.1';
const TARGETS = {
  egressIp: 'https://4.ipw.cn/',
  https8000: 'https://portquiz.takao-tech.com:8000/',
  https443: 'https://portquiz.takao-tech.com/',
  http8080: 'http://portquiz.net:8080/',
} as const;

basekit.addDomainList(['4.ipw.cn', 'httpbin.org', 'api.ipify.org', 'portquiz.takao-tech.com', 'portquiz.net']);

basekit.addField({
  formItems: [
    {
      key: 'target',
      label: '测试地址',
      component: FieldComponent.SingleSelect,
      props: {
        options: [
          { label: '查看飞书云端出口 IPv4', value: 'egressIp' },
          { label: 'HTTPS 8000（非标准端口）', value: 'https8000' },
          { label: 'HTTPS 443（标准端口对照）', value: 'https443' },
          { label: 'HTTP 8080（非标准端口）', value: 'http8080' },
        ],
      },
      defaultValue: 'egressIp',
      validator: { required: true },
    },
  ],
  resultType: { type: FieldType.Text },
  options: { disableAutoUpdate: true },
  execute: async (params: any, context: any) => {
    // SingleSelect is supplied as { label, value }; accept a plain value as well.
    const choice = params?.target?.value ?? params?.target ?? 'egressIp';
    if (typeof choice !== 'string' || !Object.prototype.hasOwnProperty.call(TARGETS, choice)) {
      return { code: FieldCode.Success, data: '请选择一个测试地址。' };
    }

    if (choice === 'egressIp') {
      const attempts: string[] = [];
      const checks = [
        { url: TARGETS.egressIp, parse: (text: string) => text.trim() },
        { url: 'https://httpbin.org/ip', parse: (text: string) => JSON.parse(text)?.origin },
        { url: 'https://api.ipify.org?format=json', parse: (text: string) => JSON.parse(text)?.ip },
      ];
      for (const check of checks) {
        try {
          const res = await context.fetch(check.url, { method: 'GET', redirect: 'manual', timeout: 5000 });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ip = check.parse(await res.text());
          if (typeof ip !== 'string' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)
            || ip.split('.').some((part) => Number(part) > 255)) {
            throw new Error('检测服务未返回单个有效的 IPv4 地址');
          }
          return { code: FieldCode.Success, data: [
            `本次请求出口 IPv4：${ip}`,
            `接收端：${check.url}`,
            `测试时间：${new Date().toISOString()}`,
            `版本：${VERSION}`,
            '此单次观测不代表固定出口地址或完整 IP 白名单。',
            ...attempts,
          ].join('\n') };
        } catch (error) {
          attempts.push(`检测失败 ${check.url}：${String(error).slice(0, 500)}`);
        }
      }
      return { code: FieldCode.Success, data: [
        '出口 IP 检测失败，未获得来源地址', ...attempts,
        `测试时间：${new Date().toISOString()}`, `版本：${VERSION}`,
      ].join('\n') };
    }

    const url = TARGETS[choice as keyof typeof TARGETS];
    const started = Date.now();
    let stage = '发起请求';
    console.log('[port-probe]', { version: VERSION, url });

    try {
      const response = await context.fetch(url, {
        method: 'GET',
        redirect: 'manual',
        timeout: 15000,
      });
      stage = '读取响应';
      const responseText = await response.text();
      const elapsed = Date.now() - started;
      console.log('[port-probe response]', { url, status: response.status, elapsed });
      return {
        code: FieldCode.Success,
        data: [
          '已收到 HTTP 响应',
          `地址：${url}`,
          `HTTP 状态：${response.status}`,
          `耗时：${elapsed} ms`,
          response.status >= 300 && response.status < 400 ? '未跟随重定向，请检查服务响应。' : '',
          `测试时间：${new Date().toISOString()}`,
          `版本：${VERSION}`,
        ].filter(Boolean).join('\n'),
      };
    } catch (error: any) {
      const elapsed = Date.now() - started;
      console.log('[port-probe error]', { url, stage, elapsed, error: String(error), stack: error?.stack });
      return {
        code: FieldCode.Success,
        data: [
          '测试失败',
          `地址：${url}`,
          `阶段：${stage}`,
          `错误：${String(error).slice(0, 1000)}`,
          `耗时：${elapsed} ms`,
          `测试时间：${new Date().toISOString()}`,
          `版本：${VERSION}`,
        ].join('\n'),
      };
    }
  },
});

export default basekit;
