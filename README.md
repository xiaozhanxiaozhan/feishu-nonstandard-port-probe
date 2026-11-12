# 公网非标准端口测试

一个用于验证飞书字段捷径线上运行环境是否能访问非标准端口的最小插件。

## 使用

添加字段捷径后，选择一个测试地址，在一条测试记录上手动运行：

| 选项 | 固定请求地址 |
| --- | --- |
| 查看飞书云端出口 IPv4（默认） | `https://4.ipw.cn/（失败时尝试 https://httpbin.org/ip 与 https://api.ipify.org?format=json）` |
| HTTPS 8000 | `https://portquiz.takao-tech.com:8000/` |
| HTTPS 443（对照） | `https://portquiz.takao-tech.com/` |
| HTTP 8080 | `http://portquiz.net:8080/` |

插件使用飞书提供的 `context.fetch` 发起一次 GET 请求，输出 HTTP 状态、耗时、请求地址和失败阶段。不会跟随重定向；HTTP 4xx/5xx 同样意味着已经收到服务器响应，不能简单归为端口被拦截。

“查看飞书云端出口 IPv4”选项解析公网 IP 回显服务返回的 `ip`，并将其写回字段。必须在飞书内实际运行才能观测云端出口；在电脑上运行代码获得的是本地请求出口。单次观测不能代替飞书对固定出口或完整 IP 范围的承诺；访问其他目的地址的最终来源 IP 应以该服务的接入日志为准。

默认关闭自动更新，避免无意中对多条记录反复调用。请求地址是固定的，不发送记录字段、手机号、Token 或业务参数；服务响应正文不写入日志或表格。第三方服务会接收到正常网络请求所包含的来源 IP。

## 本地构建

```sh
npm ci
npm run check
npm run build
npm run pack
```

在飞书开发者中心选择“字段捷径”，发布范围选择“本人可见”。

本机访问成功只用于确认测试服务可用；插件发布后仍需在飞书内运行，才能判断飞书线上环境的行为。

## 测试服务

- HTTPS 端口检测服务说明：https://portquiz.takao-tech.com/
- HTTP 端口检测服务说明：http://portquiz.net/

版本：1.1.1
