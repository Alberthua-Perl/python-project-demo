@startuml
title KServe + ModelMesh 多模型服务协作时序（OpenShift AI）

actor 用户
participant "OpenShift AI\n控制台" as UI
participant "KServe\nController" as KS
participant "ModelMesh\nOperator" as MM
participant "Ingress Gateway\n(Istio)" as GW
participant "ModelMesh\nRuntime Pod\n(多模型共享 Pod)" as POD
participant "Puller\n(模型下载器：ovms-adapter 容器)" as Pull
participant "ModelMesh\nMesh容器\n(请求路由 & LRU：mm 容器)" as MMRT
participant "Autoscaler\n(KPA)\n(仅用于可选 Knative 模式)" as AS
database "S3/PVC\n模型存储" as S3

== ① 控制面：创建多模型服务 ==
用户 -> UI : 部署多模型 InferenceService
UI -> KS : POST InferenceService YAML（多模型）
KS -> MM : 生成 ModelMesh ServingRuntime CR
note right : 多模型 = 1 Pod 加载 N 模型\n**默认不注入 queue-proxy**（见下文）

== ② 无请求：缩容到 0（可选 Knative 模式） ==
== ②-A 默认模式：纯 K8s Deployment ==
MM -> MM : Deployment 副本 = 0\n（ModelMesh Controller 直接置 0）
note right : 无 queue-proxy → 无 Knative 冷启动\n**缩容由 ModelMesh 自己实现**
== ②-B 可选 Knative 模式 ==
loop 每 100 ms（若启用 Knative）
   QP -> AS : 上报并发（8012）
end
AS -> AS : 持续 = 0 → 副本 = 0
note right : 若显式开启 Knative，则注入 queue-proxy\n**此时才有 Serverless 缩容到 0**

== ③ 冷启动触发（0→1） ==
用户 -> GW : POST /v2/models/m1/infer
GW -> MMRT : 请求到达 ModelMesh Mesh 容器
MMRT -> MM : 本地无模型 → 触发加载
MM -> Pull : 下发“拉取模型 m1”指令
Pull -> S3 : 下载模型文件
Pull -> MMRT : 模型加载完成
MMRT -> MM : 返回“就绪”
MMRT -> GW : 返回推理结果
note right : 冷启动 ≈ 秒级（无 queue-proxy 加速）

== ④ 正常运行（N≥1） ==
user -> GW : 后续请求
GW -> MMRT : 直接命中本地缓存
MMRT -> MM : 路由到已加载模型
MMRT -> GW : 返回结果
note right : 高密度共享 Pod\n**无 queue-proxy 代理流量**

== ⑤ 再次缩容回 0（可选） ==
== ⑤-A 默认模式 ==
MM -> MM : 模型引用计数 = 0
MM -> MM : 删除 Deployment
note right : **ModelMesh 自己实现“缩到 0”**
== ⑤-B 可选 Knative 模式 ==
QP -> AS : 持续 0 → 副本 = 0
AS -> KSVC : Public Service 再次指向 ACT
note right : 若启用了 Knative，则走单模型同款链

@enduml