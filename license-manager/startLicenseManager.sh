# launch network; create channel and join peer to channel
cd ../first-network
docker rm -f $(docker ps -aq)
./byfn.sh generate
./byfn.sh -m restart -l node

