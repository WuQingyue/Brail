- 查看本地分支
git branch 
- 查看远程仓库的地址
git remote -v
- 撤销本地仓库的最近一次提交（保留暂存区）
git reset --soft HEAD~1
- 同步撤销远程仓库的提交
git push --force-with-lease Brail main

# 1. 创建 database 分支（基于当前分支）
git branch database

# 2. 切换到 database 分支
git checkout database

# 3.  提交到本地仓库
git commit -m 

# 4. 将 database 分支推送到远程仓库
git push -u Brail database


代码目录
backend 前端 vue
backend 后端 fastapi
-- integration_tests 集成测试
.github/workflows/ Github Actions 配置文件

spec-kit
- 先把需要做什么写成一份清晰可执行的规格规范
- 让AI根据规格规范产出计划任务清单
- 最后再按照任务生成代码实现项目开发
- 支持测试驱动开发TDD

- 安装uv:pip install uv
-
- 不使用的原因：本网站太大，超过模型限制，无法一次生成

TDD:
    - 先写测试
    - 在写简单的代码使其通过测试
    - 重构代码，既能通过测试，又能提高代码的可维护性、可读性、网站性能等
在 TDD 的“红-绿-重构”循环中：
- 红灯（Red）： 你先写一个单元测试，它描述了你想要实现的新功能，但因为这个功能尚未实现，所以这个测试会失败（Failing）。
- 绿灯（Green）： 此时，第一条规则（你不得编写任何产品代码，除非是为了使一个失败的单元测试通过）就生效了。
    - 你现在编写最少量的产品代码。
    - 你的目标就是让刚才那个处于失败状态的测试用例运行成功（Passing）。
- 重构（Refactor）： 一旦所有测试（包括你刚刚通过的那个）都通过了（Passing/Green），你就可以安全地重构代码。


Github Actions 进度
test_database.yml ：
- 测试数据库连接红阶段
- 测试数据库连接绿阶段
- 测试数据库连接重构阶段

- 测试 brail_db 数据库是否存在红阶段
- 测试 brail_db 数据库是否存在绿阶段
- 测试 brail_db 数据库是否存在重构阶段

- 测试创建 brail_db 数据库红阶段
- 测试创建 brail_db 数据库绿阶段
- 测试创建 brail_db 数据库重构阶段