import { ethers } from "ethers";
import { useState, useEffect } from 'react';
import { Web3 } from 'web3';


export function EvmSelectTool() {

  const [chainConfigMap, setChainConfigMap] = useState(new Map());
  const [chain, setChain] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [smartContractAddress, setSmartContractAddress] = useState("");
  const [smartContractABI, setSmartContractABI] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageNum, setPageNum] = useState(1);
  const [methodName, setMethodName] = useState("");
  const [resultData, setResultDate] = useState<any>({});

  const OK_ACCESS_KEY = `${import.meta.env.VITE_OK_ACCESS_KEY}`;

  const chainConfigList = [
    { "chainName": "Ethereum", "chainValue": "ETH", "url": "https://eth-mainnet.g.alchemy.com/v2/demo" },
    { "chainName": "OKTC", "chainValue": "OKTC", "url": "https://exchainrpc.okex.org" },
    { "chainName": "X Layer", "chainValue": "XLAYER", "url": "https://xlayerrpc.okx.com" },
    { "chainName": "BSC", "chainValue": "BSC", "url": "https://bsc-rpc.publicnode.com" },
    { "chainName": "Polygon", "chainValue": "POLYGON", "url": "https://polygon-mainnet.public.blastapi.io" },
    { "chainName": "Avalanche", "chainValue": "AVAXC", "url": "https://avalanche.drpc.org" },
    { "chainName": "Optimism", "chainValue": "OP", "url": "https://mainnet.optimism.io" },
    { "chainName": "Arbitrum", "chainValue": "ARBITRUM", "url": "https://arb1.arbitrum.io/rpc" },
    { "chainName": "Klaytn", "chainValue": "KLAYTN", "url": "https://public-en-cypress.klaytn.net" },
    { "chainName": "zkSync", "chainValue": "ZKSYNC", "url": "https://mainnet.era.zksync.io" },
    { "chainName": "Gnosis", "chainValue": "GNOSIS", "url": "https://rpc.gnosischain.com" },
    { "chainName": "Ronin", "chainValue": "RONIN", "url": "https://api.roninchain.com/rpc" },
    { "chainName": "Linea", "chainValue": "LINEA", "url": "https://rpc.linea.build" },
    { "chainName": "Tron", "chainValue": "TRON", "url": "https://api.trongrid.io" },
    { "chainName": "Base", "chainValue": "BASE", "url": "https://base.drpc.org" },
    { "chainName": "Scroll", "chainValue": "SCROLL", "url": "https://scroll.drpc.org" },
    { "chainName": "Omega", "chainValue": "OMEGA", "url": "https://mainnet-rpc.omtch.com/" },
    { "chainName": "opBNB", "chainValue": "OPBNB", "url": "https://opbnb-rpc.publicnode.com" },
    { "chainName": "Manta", "chainValue": "MANTA", "url": "https://manta-pacific.drpc.org" },
    { "chainName": "Canto", "chainValue": "CANTO", "url": "https://canto-rpc.ansybl.io" },
  ]

  useEffect(() => {
    let chainConfigMap = new Map();
    chainConfigList.map((chainObject, index) => {
      chainConfigMap.set(chainObject.chainValue, chainObject);
      if (index == 0) {
        setChain(chainObject.chainValue);
        console.log(chainObject.chainValue);
      }
    });
    setChainConfigMap(chainConfigMap);
  }, []);

  function changeChain(event: any) {
    setChain(event.target.value);
    setResultDate({});
  }

  function confirmQuery() {
    setResultDate({});
    let headers = new Headers();
    headers.append("Ok-Access-Key", OK_ACCESS_KEY);

    let data: any = {
      chainShortName: chain,
      address: walletAddress,
      page: pageNum,
      limit: pageSize
    }

    const params = Object.keys(data).map(
      function (keyName) {
        return encodeURIComponent(keyName) + '=' + encodeURIComponent(data[keyName])
      }
    ).join('&');

    var requestOptions: any = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    };

    let url = "https://www.oklink.com/api/v5/explorer/address/normal-transaction-list?" + params;

    fetch(url, requestOptions)
      .then(response => response.json())
      .then((result: any) => {
        if (result.data.length > 0) {
          let resultData: any = new Object();
          resultData.totalPage = result.data[0].totalPage;
          let transactionList: any = [];
          resultData.transactionList = transactionList;
          result.data[0].transactionList.some((data: any) => {
            console.log(data);
            if (smartContractAddress !== ""
              && data.from.toLowerCase() !== smartContractAddress.toLowerCase()
              && data.to.toLowerCase() !== smartContractAddress.toLowerCase()
            ) {
              return;
            }
            if (smartContractABI !== ""
              && methodName !== ""
              && methodName.toLowerCase() !== getMethodName(data.methodId).toLowerCase()
            ) {
              return;
            }
            let result: any = new Object();
            result.txId = data.txId;
            result.methodName = getMethodName(data.methodId);
            let fromPrefix = `(${data.isFromContract ? "Contract" : "User"}) `;
            result.fromAddress = fromPrefix + data.from;
            let toPreFix = `(${data.isToContract ? "Contract" : "User"}) `;
            result.toAddress = toPreFix + data.to;
            let time = new Date();
            time.setTime(Number(data.transactionTime));
            result.time = time.toLocaleString();
            transactionList.push(result);
          });
          setResultDate(resultData);
        }
      })
      .catch(error => console.log('error', error));
  }

  // 取得方法 ID 對應的方法名稱
  function getMethodName(methodId: string) {
    if (methodId === "" || smartContractABI === "") {
      return methodId;
    }
    let web3: Web3 = new Web3(chainConfigMap.get(chain).url);
    for (const method of JSON.parse(smartContractABI)) {
      if (method.type === "function") {
        const methodSignature = encodeFunctionSignature(web3, method.name, method.inputs);
        console.log(methodSignature);
        if (methodSignature === methodId) {
          return method.name;
        }
      }
    }
    console.error(`Method name for methodId ${methodId} not found in ABI.`);
    return methodId;
  }

  function encodeFunctionSignature(web3: any, functionName: string, inputs: any) {
    const inputTypes = inputs.map((input: any) => `${input.type}`);
    const signature = `${functionName}(${inputTypes.join(',')})`;
    console.log(signature);
    return web3.eth.abi.encodeFunctionSignature(signature);
  }

  const selectStyle = {
    height: "30px",
    width: "150px"
  }

  const textareaStyle = {
    width: "500px",
    height: "200px"
  }

  const inputTextStyle = {
    width: "500px",
    height: "30px"
  }

  const inputNumberStyle = {
    width: "150px",
    height: "25px"
  }

  const chainDivStyle = {
    display: "inline-table",
    width: "30%"
  }

  const btnDivStyle = {
    display: "inline-table",
    width: "20%"
  }

  const resultDivStyle = {
    display: "inline-table",
    width: "100%"
  }

  const tableStyle = {
    border: "1px solid red",
  }

  const thStyle = {
    border: "1px solid red",
    backgroundColor: "#64ff87",
    padding: "10px 10px"
  }

  const tdStyle = {
    border: "1px solid red",
    backgroundColor: "#61dafb",
    padding: "10px 10px"
  }

  return (
    <>
      <div>
        <div style={chainDivStyle}>
          <div>
            <h3>Chain</h3>
            <select style={selectStyle} onChange={(e) => changeChain(e)} defaultValue={chain}>
              {
                chainConfigMap.size > 0
                  ?
                  Array.from(chainConfigMap.keys()).map((key) => {
                    return (
                      <option key={chainConfigMap.get(key).chainName}
                        value={key}>{chainConfigMap.get(key).chainName}</option>
                    )
                  })
                  :
                  <option>No Data</option>
              }
            </select>
          </div>

          <div>
            <h3>Wallet Address :</h3>
            <input type="text" style={inputTextStyle} value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
          </div>

          <div>
            <h3>Smart Contract Address :</h3>
            <input type="text" style={inputTextStyle} value={smartContractAddress} onChange={(e) => setSmartContractAddress(e.target.value)} />
          </div>

          <div>
            <h3>Smart Contract ABI :</h3>
            <textarea style={textareaStyle} value={smartContractABI} onChange={(e) => setSmartContractABI(e.target.value)} />
          </div>
        </div>

        <div style={btnDivStyle}>

          <div>
            <h5>Method Name</h5>
            <input type="text" style={inputNumberStyle} value={methodName} onChange={(e) => setMethodName(e.target.value)} />
          </div>

          <div>
            <h5>Page Size (Max : 100)</h5>
            <input type="number" style={inputNumberStyle} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} />
          </div>

          <div>
            <h5>Page Num (Min : 1)</h5>
            <input type="number" style={inputNumberStyle} value={pageNum} onChange={(e) => setPageNum(Number(e.target.value))} />
          </div>

          <div>
            <br />
            <button onClick={confirmQuery}>Confirm</button>
          </div>
        </div>

        <div style={resultDivStyle}>
          <h3>Result</h3>
          {
            resultData
              ?
              <h5>Total Page : {resultData.totalPage}</h5>
              :
              <></>
          }
          <div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Transaction Hash</th>
                  <th style={thStyle}>method Name</th>
                  <th style={thStyle}>From Address</th>
                  <th style={thStyle}>To Address</th>
                  <th style={thStyle}>Transaction Time</th>
                </tr>
              </thead>
              <tbody>
                {
                  resultData.transactionList?.length > 0
                    ?
                    resultData.transactionList.map((tx: any, index: any) => {
                      return (
                        <tr key={index}>
                          <td style={tdStyle}>{tx.txId}</td>
                          <td style={tdStyle}>{tx.methodName}</td>
                          <td style={tdStyle}>{tx.fromAddress}</td>
                          <td style={tdStyle}>{tx.toAddress}</td>
                          <td style={tdStyle}>{tx.time}</td>
                        </tr>
                      )
                    })
                    :
                    <tr>
                      <td colSpan={5}> No Data </td>
                    </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}