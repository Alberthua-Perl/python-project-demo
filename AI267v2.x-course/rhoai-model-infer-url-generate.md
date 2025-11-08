@startuml
title OpenShift AI 推理 URL 生成时序图

actor 用户
participant "OpenShift AI\n控制台" as UI
participant "KServe Controller\n(redhat-ods-applications 项目中的\nkserve-controller-manager pod)" as KS
participant "Knative Serving Operator\n(knative-serving 项目中的 controller pod)" as KSVC
participant "ModelMesh Operator\n(redhat-ods-applications 项目中的 modelmesh-controller pod)" as MM
participant "Istio\nGateway" as GW
database "S3/PVC\n模型存储" as S3

== ① 单模型服务 URL 生成（KServe + Knative） ==
用户 -> UI : 部署单模型 InferenceService
UI -> KS : POST InferenceService YAML
KS -> KSVC : 生成 Knative Service CR
KSVC -> KSVC : 创建 Revision（含 queue-proxy）
KSVC -> GW : 创建 Istio Gateway + Route
GW -> GW : 分配 **OpenShift Route 域名**
KSVC -> KSVC : 写回 **.status.url**
KS -> KS : 写回 **.status.url**
用户 -> KS : oc get isvc <m> -o jsonpath='{.status.url}'
note right : 返回：**https://<model>-<proj>.apps.cluster.example.com**

== ② 多模型服务 URL 生成（ModelMesh） ==
用户 -> UI : 部署多模型 InferenceService
UI -> MM : POST InferenceService YAML（ModelMesh 模式）
MM -> MM : 创建 **共享 Deployment**（无 Knative）
MM -> MM : 创建 **ClusterIP Service**（固定名字）
MM -> MM : 写回 **.status.components.predictor.restUrl**
MM -> KS : 写回 **.status.components.predictor.restUrl**
用户 -> MM : oc get isvc <m> -o jsonpath='{.status.components.predictor.restUrl}'
note right : 返回：**http://modelmesh-serving.modelmesh-serving:8008**

@enduml