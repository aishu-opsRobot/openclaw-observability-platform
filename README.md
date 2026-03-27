# openclaw-observability

docker build -t openclaw-observability  .


docker compose up -d 

或者  
1.前端后端安装：
docker-compose -f docker-compose-build.yml up -d

2.vector 上传数据
brew tap vectordotdev/brew && brew install vector
vector --config  vector.yaml
