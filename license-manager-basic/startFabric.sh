set -e

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
LANGUAGE=${1:-"golang"}
#CC_SRC_PATH=github.com/license-manager/go
#if [ "$LANGUAGE" = "node" -o "$LANGUAGE" = "NODE" ]; then
CC_SRC_PATH=/opt/gopath/src/github.com/license-manager/node
#fi

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
cd ../basic-network
./start.sh


# Now launch the CLI container in order to install, instantiate chaincode
# and prime the ledger with our 10 cars
docker-compose -f ./docker-compose.yml up -d cli

printf "***************************************************************"
printf  ""
printf "*****************Back*************************"
printf ""
printf "***************************************************************"

docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode install -n license-manager -v 1.5 -p "$CC_SRC_PATH" -l "$LANGUAGE"

printf "*****************Step 1 donedanadone*************************"


docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n license-manager -l "$LANGUAGE" -v 1.5 -c '{"Args":[""]}' -P "OR ('Org1MSP.member','Org2MSP.member')" 

printf "*****************Step 2 donedanadone*************************"

sleep 10

printf "*****************Starting Step 3*************************"
docker exec -e "CORE_PEER_LOCALMSPID=Org1MSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" cli peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n license-manager -c '{"function":"initLedger","Args":[""]}'

printf "*****************Step 3 donedanadone*************************"

printf "\nTotal setup execution time : $(($(date +%s) - starttime)) secs ...\n\n\n"
printf "Start by installing required packages run 'npm install'\n"
printf "Then run 'node enrollAdmin.js', then 'node registerUser'\n\n"
printf "The 'node invoke.js' will fail until it has been updated with valid arguments\n"
printf "The 'node query.js' may be run at anytime once the user has been registered\n\n"
