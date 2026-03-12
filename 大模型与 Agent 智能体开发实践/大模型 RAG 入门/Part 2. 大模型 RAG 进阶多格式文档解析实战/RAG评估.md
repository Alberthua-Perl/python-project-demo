<h1 id="A9atq">一.RAG效果评估的必要性</h1>
+ <font style="color:rgb(0, 0, 0);">评估出RAG对大模型能力改善的程度</font>
+ <font style="color:rgb(0, 0, 0);">RAG优化过程，通过评估可以知道改善的方向和参数调整的程度</font>

<h1 id="HCceE">二.RAG评估方法</h1>
<h2 id="MyoUa">1.人工评估</h2>
+ <font style="color:rgb(0, 0, 0);">最Low的方式是进行人工评估：邀请专家或人工评估员对RAG生成的结果进行评估。他们可以根据预先定义的标准对生成的答案进行质量评估，如准确性、连贯性、相关性等。这种评估方法可以提供高质量的反馈，但可能会消耗大量的时间和人力资源。</font>

<h2 id="hJpzW">2.自动化评估</h2>
+ <font style="color:rgb(0, 0, 0);">自动化评估肯定是RAG评估的主流和发展方向。</font>

<h2 id="gZxaQ">3.LangSmith</h2>
+ <font style="color:rgb(0, 0, 0);">需要准备测试数据集 不仅可以评估RAG效果，对于LangChain中的Prompt模板等步骤都可进行测试评估。</font>

<h2 id="HATIm">4.RAGAS</h2>
+ <font style="color:rgb(0, 0, 0);">RAGAs（Retrieval-Augmented Generation Assessment）是一个评估框架，文档。考虑检索系统识别相关和重点上下文段落的能力，LLM 以忠实方式利用这些段落的能力，以及生成本身的质量。</font>

| <font style="color:rgb(15, 17, 21);">维度</font> | <font style="color:rgb(15, 17, 21);">LangSmith</font> | <font style="color:rgb(15, 17, 21);">RAGAS</font> |
| --- | --- | --- |
| **<font style="color:rgb(15, 17, 21);">核心定位</font>** | <font style="color:rgb(15, 17, 21);">大模型应用的</font>**<font style="color:rgb(15, 17, 21);">集成开发平台</font>**<font style="color:rgb(15, 17, 21);"> </font><font style="color:rgb(15, 17, 21);">(调试、测试、评估、监控)</font> | **<font style="color:rgb(15, 17, 21);">专门的RAG评估框架</font>**<font style="color:rgb(15, 17, 21);">，用于量化RAG管道在不同组件层面上的性能</font> |
| **<font style="color:rgb(15, 17, 21);">核心功能</font>** | <font style="color:rgb(15, 17, 21);">提供全链路功能：应用</font>**<font style="color:rgb(15, 17, 21);">调试、测试、评估、监控</font>** | **<font style="color:rgb(15, 17, 21);">专注于评估</font>**<font style="color:rgb(15, 17, 21);">，提供针对RAG的专用评估指标</font> |
| **<font style="color:rgb(15, 17, 21);">评估方式</font>** | <font style="color:rgb(15, 17, 21);">支持</font>**<font style="color:rgb(15, 17, 21);">自定义评估函数</font>**<font style="color:rgb(15, 17, 21);">和</font>**<font style="color:rgb(15, 17, 21);">基于参考答案的评估</font>**<font style="color:rgb(15, 17, 21);"> </font><font style="color:rgb(15, 17, 21);">(如精确匹配)</font><font style="color:rgb(15, 17, 21);">，以及</font>**<font style="color:rgb(15, 17, 21);">LLM即评委</font>**<font style="color:rgb(15, 17, 21);">等多种方式</font> | <font style="color:rgb(15, 17, 21);">提供一套</font>**<font style="color:rgb(15, 17, 21);">预设的、无需参考答案</font>**<font style="color:rgb(15, 17, 21);">的评估指标</font><font style="color:rgb(15, 17, 21);">，可程序化计算</font> |
| **<font style="color:rgb(15, 17, 21);">关键评估指标</font>** | <font style="color:rgb(15, 17, 21);">支持广泛，取决于配置。可包括</font>**<font style="color:rgb(15, 17, 21);">精确匹配、工具调用准确性、自定义指标</font>**<font style="color:rgb(15, 17, 21);">等</font> | **<font style="color:rgb(15, 17, 21);">忠实度、答案相关性、上下文精度、上下文召回率</font>**<font style="color:rgb(15, 17, 21);">等RAG核心指标</font> |
| **<font style="color:rgb(15, 17, 21);">使用复杂度</font>** | <font style="color:rgb(15, 17, 21);">相对较高，需要集成到开发流程中，配置数据集和评估器</font> | <font style="color:rgb(15, 17, 21);">相对较低，专注于评估，可通过几行代码对现有输入输出进行评估</font> |
| **<font style="color:rgb(15, 17, 21);">数据需求</font>** | <font style="color:rgb(15, 17, 21);">通常需要</font>**<font style="color:rgb(15, 17, 21);">构建包含输入和预期输出的测试数据集</font>** | **<font style="color:rgb(15, 17, 21);">无需参考答案</font>**<font style="color:rgb(15, 17, 21);">即可计算大部分核心指标</font> |


<h2 id="ICzuA"><font style="color:rgb(0, 0, 0);">5.数据集格式</font></h2>
+ <font style="color:rgb(0, 0, 0);">question：作为 RAG 管道输入的用户查询。输入。</font>
+ <font style="color:rgb(0, 0, 0);">answer：从 RAG 管道生成的答案。输出。</font>
+ <font style="color:rgb(0, 0, 0);">contexts：从用于回答question外部知识源中检索的上下文。</font>
+ <font style="color:rgb(0, 0, 0);">ground_truths：question的基本事实答案。这是唯一人工注释的信息。</font>

<h1 id="JBDqZ">三.评估指标</h1>
<h2 id="HXDEb"><font style="color:rgb(0, 0, 0);">1.评估检索质量:</font></h2>
+ <font style="color:rgb(0, 0, 0);">context_relevancy（上下文相关性，也叫 context_precision）</font>
+ <font style="color:rgb(0, 0, 0);">context_recall（召回性，越高表示检索出来的内容与正确答案越相关）</font>

<h2 id="cqQvE"><font style="color:rgb(0, 0, 0);">2.评估生成质量：</font></h2>
+ <font style="color:rgb(0, 0, 0);">faithfulness（忠实性，越高表示答案的生成使用了越多的参考文档（检索出来的内容））</font>
+ <font style="color:rgb(0, 0, 0);">answer_relevancy（答案的相关性）</font>

<font style="color:rgb(0, 0, 0);">Context Recall：上下文召回衡量检索到的上下文(contexts)与标准答案（ground_truths）的匹配程度。</font>

