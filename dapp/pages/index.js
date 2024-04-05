import Head from 'next/head'
import { Inter, Turret_Road } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import Web3Modal from 'web3modal'
import React, { useEffect, useRef, useState } from 'react'
import { ethers, toBigInt } from 'ethers'
import { CONTRACT_ADDRESS, abi } from '@/constants'
import { subgraphQuery } from '@/utils'
import { FETCH_CREATED_GAME } from '@/queries'
const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  
  
  const [walletConnected, setWalletConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [maxPlayers,setMaxPLayers] = useState(0)
  const [entryfee,setEntryfee] = useState("")
  const [players, setPlayers] = useState([])
  const [gameStarted,setGameStarted] = useState(false)
  const [winner, setWinner] = useState("")
  const [logs, setLogs] = useState([])
  const web3ModalRef = useRef()

  const forceUpdate = React.useReducer(() => ({}), {})[1];


  const getProviderOrSigner = async(needSigner = true)=>{
    try {

      const provider = await web3ModalRef.current.connect()
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const {chainId} = await web3Provider.getNetwork()
      if(chainId != 80001){
        window.alert("Change the network to polygon mumbai testnet")
        throw new Error("Expected chainId 80001 got something else")
      }

      if(needSigner){
        const signer = await web3Provider.getSigner()
        return signer
      }

      return web3Provider
      
    } catch (error) {
      console.error(error);
    }
  }

  const startGame = async(maxplayers,entryFee)=>{
      try {

        const signer = await getProviderOrSigner(true)
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer 
        )

        const tx = await contractInstance.startGame(maxplayers,entryFee)
        setLoading(true)
        await tx.wait()
        setLoading(false)

        
      } catch (error) {
        console.error(error);
      }
  }

  const join = async()=>{
    try {

        const signer = await getProviderOrSigner(true)
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          signer 
        )
        const tx = await contractInstance.joinGame({
          value : entryfee
        })
        setLoading(true)
        await tx.wait()
        setLoading(false)
        
    } catch (error) {
      console.error(error);
    }

  } 

  const checkIfGameStarted = async()=>{
    try {

      const provider =await getProviderOrSigner()
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi,
        provider
      )

      const _gameStarted = await contractInstance.gameStarted()
      const _gameList = await subgraphQuery(FETCH_CREATED_GAME())
      const _game = await _gameList.games[0]
      let _logs = []
      if(_gameStarted){
        _logs = [`Game started with ID : ${_game.id}`]
        if(_game.players && _game.players.length > 0){
          _logs.push(`${_game.players.length} / ${_game.maxPlayers} have already joined`)
          _game.players.forEach((player) => {
            _logs.push(`${player} joined.. 🏃`)
          });
        }
        setEntryfee(entryfee => _game.entryFee.toString())
        setMaxPLayers(_game.maxPlayers)
      }else if(!gameStarted && _game.winner){
        _logs = [
          `Last Game ended with ID : ${_game.id}`,
          `Winner address : ${_game.winner} 🥇`,
          `Waiting for host to start the Game..`
        ]
        
        setWinner(_game.winner)
      }
      setLogs(_logs)
      setPlayers(_game.players)
      setGameStarted(_gameStarted)
      forceUpdate();

    } catch (error) {
      console.error(error);
    }

  }

  const getOwner = async()=>{
    
    try {

        const provider = await getProviderOrSigner()
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          abi,
          provider
        )
        const signer =  await getProviderOrSigner(true)
        const address = await signer.getAddress()

        const owner = await contractInstance.owner()
        if(owner == address){
          setIsOwner(true)
        }
      
    } catch (error) {
      console.error(error);
    }
  }

  const renderButton = ()=>{

    if(loading){
      return(
        <button className={styles.button}>loading...</button>
      )
    }

    if(!walletConnected){
      return(
        <button className={styles.button} onClick={connectWallet}>Connect Wallet</button>
      )
    }

    if(gameStarted){
     if(players.length == maxPlayers){
      return(
        <div className={styles.description}>Choosing Winner...</div>
      )
     }

     return(
      <button className={styles.button} onClick={()=>join()}>Join Game</button>
    )
    }

    if(isOwner && !gameStarted){
      return(
        <div>
           <input 
            placeholder='MAX PLAYERS' 
            required
            type='number' className={styles.input} 
            onChange={
              (e)=>setMaxPLayers(e.target.value)
          }/>
          <input 
            placeholder='Entry Fee(ehter)'
            required
            className={styles.input} type='number'
            onChange={
              (e)=>setEntryfee(e.target.value >="0" ? ethers.parseEther(e.target.value.toString()).toString() : null)
          }/>
          <button className={styles.button} onClick={()=>startGame(maxPlayers,entryfee)} >
              Start Game
          </button>
          
        </div>
      )
    }
  }

  

  const connectWallet = async()=>{

    await getProviderOrSigner();
    setWalletConnected(true)
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network : "mumbai",
        providerOptions : {},
        disableInjectedProvider : false
      })
      connectWallet();
      getOwner();
      checkIfGameStarted();
      setInterval(() => {
        checkIfGameStarted();
      }, 2000);
    }
  },[walletConnected])

  return (
    <>
      <Head>
        <title>Random-Winner</title>
        <meta name='description' content='RandomWinnerGame'  />
      </Head>
      <div className={styles.main}>
        <div>
        <h1 className={styles.title}>Welcome to Random Winner game..! 🎮</h1>
        <div className={styles.description}>Winner takes all the funds from the lottery poll, Join the game and stand a chance to win the lottery</div>
        {renderButton()}
        {logs && logs.map((log,index)=>(
          <div className={styles.log} key={index}>
            {log}
          </div>
        ))}
        
        </div>
         
      </div>
    </>
  )
}
