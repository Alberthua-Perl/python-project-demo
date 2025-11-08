@startuml
title KServe + Knative 在 OpenShift AI 单模型服务中的协作时序

actor 用户
participant "OpenShift AI\nDashboard" as UI
participant "KServe\nController\n(redhat-ods-applications 项目中的 pod)" as KS
participant "Knative\nServing\nOperator" as KSVC
participant "Ingress Gateway\n(Istio)" as GW
participant "Activator\n(运行状态；\nknative-serving CR 创建；\n冷启动代理" as ACT
participant "Autoscaler\n(KPA；运行: knative-serving CR 创建)" as AS
participant "queue-proxy\n(Sidecar 容器)" as QP
participant "kserve-container\n(openvino_model_server 容器)" as KC
database "S3/PVC\n模型存储" as S3

== ① 控制面：创建单模型服务 ==
用户 -> UI : 点击 Deploy
UI -> KS : POST InferenceService YAML
KS -> KSVC : knative-serving 项目：\n生成 Knative Service CR (knative-serving CR)\n（含 predictor 模板）
KSVC -> KSVC : 创建 Revision\n（镜像=模型运行时+queue-proxy）
note right : 单模型 = 1 Revision\nqueue-proxy 必注入

== ② 无请求：缩容到 0 ==
loop 每 100 ms
   QP -> AS : 上报当前并发（8012端口）
end
AS -> AS : 持续 = 0
AS -> KSVC : scale = 0\n（Deployment 副本置 0）
note right : Serverless 特性 1：资源归 0

== ③ 冷启动触发（0→1） ==
用户 -> GW : POST /v2/models/m1/infer
GW -> ACT : 请求被 Activator 缓存
ACT -> AS : 立即触发 scale=1\n（websocket 信号）
AS -> KSVC : 创建 Revision Pod\n（含 queue-proxy + kserve-container）
KSVC -> QP : 启动 queue-proxy
QP -> S3 : Puller 下载模型（冷启动）
QP -> QP : 就绪后反向连接 ACT\n说“我活了”
ACT -> QP : 把缓存请求瞬间转发
QP -> KC : 代理到模型容器
KC -> QP : 返回推理结果
QP -> ACT : 回包 → GW → 用户
note right : Serverless 特性 2：冷启动 < 1s

== ④ 正常运行（N≥1） ==
user -> GW : 后续请求
GW -> QP : Public Service 直接指向 QP\n（SKS 已切 Serve 模式）
QP -> KC : 本地代理 & 并发计量
QP -> AS : 每 100 ms 上报并发
AS -> AS : 根据并发线性扩容
note right : Serverless 特性 3：按需线性扩

== ⑤ 再次缩容回 0 ==
QP -> AS : 持续上报 “0 并发”
AS -> KSVC : scale = 0
KSVC -> ACT : Public Service 再次指向 ACT
note right : Serverless 特性 1：再次缩到 0
@enduml