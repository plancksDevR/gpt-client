import './normal.css'
import React, { useState, useEffect } from 'react'
//import io from 'socket.io-client'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Client } from '@azure/web-pubsub'

/*const socket = io(process.env.BACKEND_URL, { // || 'http://localhost:8000'
  withCredentials: true
})
console.log("Backend URL: ", process.env.BACKEND_URL)*/




const client = new Client({
  connectionString: process.env.AZURE_WEBPUBSUB_CONNECTION_STRING,
})

const subscription = client.subscribe('chatUpdates')



const App = () => {

  const [ value, setValue ] = useState(null)
  const [ message, setMessage ] = useState("")
  const [ previousChats, setPreviousChats ] = useState([])
  //const [ currentTitle, setCurrentTitle ] = useState(null)
  const [ lastClickedItem, setLastClickedItem ] = useState(null)
  const [ isSidebarOpen, setIsSidebarOpen ] = useState(true)
  const [ currentChat, setCurrentChat ] = useState([])
  const [ currentChatID, setCurrentChatID ] = useState(null)
  //const [ uniqueTitles, setUniqueTitles ] = useState([])
  const [ chatList, setChatList ] = useState([])
  const [ isTextboxEmpty, setIsTextboxEmpty ] = useState(true)
  const [ loading, setLoading ] = useState(false)
  const [ answer, setAnswer ] = useState("")
  const [ responseChat, setResponseChat ] = useState(null)
  //const [ fullResponse, setFullResponse ] = useState("")
  const [ callingAPI, setCallingAPI ] = useState(false)
  //const [ isCodeBlock, setIsCodeBlock ] = useState(false)
  //const [ code, setCode ] = useState([])

  


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const createNewChat = () => {
    setValue("")
    setMessage("")
    //setCurrentTitle(null)
    setCurrentChat([])
    setCurrentChatID(null)
  }

  const handleClick = (chatElement) => {
    //setCurrentTitle(uniqueTitle)
    setValue("")
    setMessage("")
    setLastClickedItem(chatElement)
    setCurrentChat(previousChats[chatElement])
    setCurrentChatID(chatElement)
  }

  const updateChatHistory = (newChatHistory, newChatIDs) => {
    sessionStorage.setItem('chatHistory', JSON.stringify(newChatHistory))
    sessionStorage.setItem('chatIDs', JSON.stringify(newChatIDs))
  }

  const getChatHistory = () => {
    const storedChatHistory = sessionStorage.getItem('chatHistory')
    return storedChatHistory ? JSON.parse(storedChatHistory) : []
  }

  const getChatIDs = () => {
    const storedChatIDs = sessionStorage.getItem('chatIDs')
    return storedChatIDs ? JSON.parse(storedChatIDs) : []
  }
  



  

  const handleSubmitButtonClick = async () => {
    try {
      setCallingAPI(true)

      const newChatID = currentChatID || `Chat${Object.keys(previousChats).length + 1}`

      
      setLoading(true)
      setAnswer("")
      setMessage("")
      
      if (!currentChatID) {
        setChatList((prevChatList) => [...prevChatList, newChatID])
      }

      setCurrentChatID(newChatID)
      setResponseChat(newChatID)

      const timestamp = new Date().toISOString()
      const formattedTimestamp = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      }).format(new Date(timestamp))
      
      
      
      setPreviousChats((prevChats) => ({
        ...prevChats,
        [newChatID]: [
          ...(prevChats[newChatID] || []),
          {
            role: 'user',
            content: value,
            timeStamp: formattedTimestamp,
          },
        ],
      }))


      
      
      const currentChatArray = previousChats[newChatID] || []
      const updatedChatBeforeAPI = [
        ...currentChatArray,
        {
          role: 'user',
          content: value,
          timeStamp: formattedTimestamp,
        },
      ]
      setValue('')


      //socket.emit('userInput', updatedChatBeforeAPI)
      client.send({
        channel: 'chatUpdates',
        message: JSON.stringify(updatedChatBeforeAPI)
      })

      
      setPreviousChats((prevChats) => ({
        ...prevChats,
        [newChatID]: [
          ...(prevChats[newChatID] || []),
          {
            role: 'assistant',
            content: '',
            timeStamp: '',
          },
        ],
      }))

      

      
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    //console.log('Retrieving chat history...')
    setPreviousChats(getChatHistory())
    setChatList(getChatIDs())
  }, [])


  useEffect(() => {
    if (answer !== "" && responseChat && !loading) {
      setPreviousChats((prevChats) => {
        const responseChatArray = prevChats[responseChat] || []
        const lastMessage = responseChatArray[responseChatArray.length - 1]
      
        // Check if the last message exists and is from the assistant
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '' && answer) {
          // Update the content of the last message
          lastMessage.content = answer
          // add a timestamp to the response message
          const timestampResponse = new Date().toISOString()
          const formattedTimestampResponse = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          }).format(new Date(timestampResponse))

          lastMessage.timeStamp = formattedTimestampResponse

          //console.log('Updating chat history...')
          updateChatHistory(previousChats, chatList)
        }
        setCallingAPI(false)
      
        return {
          ...prevChats,
          [responseChat]: [...responseChatArray],
        }
      })
    }
  }, [responseChat, answer, loading])

  

  /*useEffect(() => {
    socket.on('serverUpdate', (data) => {
      //console.log('Received data from server:', data)
      if (data !== "[DONE]" && data) {
        setAnswer((prevAnswer) => prevAnswer + data)
      } else {
        setMessage((prevMessage) => prevMessage + answer)
        setLoading(false)
      }
    })


    // Listen for errors from the server
    socket.on('serverError', (error) => {
      console.error('Server Error:', error)
    })

    return () => {
      // Clean up event listeners when the component unmounts
      socket.off('serverUpdate')
      socket.off('serverError')
    }
  }, [])*/

  useEffect(() => {
    

    subscription.on('message', (data) => {
      if (data !== "[DONE]" && data) {
        setAnswer((prevAnswer) => prevAnswer + data)
      } else {
        setMessage((prevMessage) => prevMessage + answer)
        setLoading(false)
      }
    })

    return () => {
      // Clean up event listeners when the component unmounts
      subscription.off('message')
    }
  }, [])

  

  useEffect(() => {
    if (!value) {
      setIsTextboxEmpty(true)
    } else {
      setIsTextboxEmpty(false)
    }
  }, [value])

  useEffect(() => {
    console.log("Previous Chats updated: ", previousChats)
    console.log("Chat IDs updated: ", chatList)
    console.log("Current Chat: ", currentChat)
    console.log("Current ChatID: ", currentChatID)
  }, [previousChats, chatList, currentChat, currentChatID])
    


  useEffect(() => {
    setLastClickedItem(currentChatID)
    setCurrentChat(previousChats[currentChatID])
  }, [currentChatID, previousChats])

  useEffect(() => {
    const textarea = document.querySelector("textarea")
    const feedChat = document.querySelector(".feed")
    const margBot = document.querySelector(".bottom-section")
    const inpContainer = document.querySelector(".input-container")
  
    const handleKeyUp = (e) => {
      textarea.style.height = "56px"
      let scHeight = e.target.scrollHeight
      textarea.style.height = `${scHeight}px`

      margBot.style.height = "80px"

      if (margBot && scHeight <= 200) {
        margBot.style.height = `${scHeight + 40}px`
        inpContainer.style.height = `${scHeight + 2}px`
      } else if (margBot && scHeight > 200) {
        margBot.style.height = "240px"
        inpContainer.style.height = "202px"
      }

      if(feedChat && scHeight <= 200) {
        feedChat.style.marginBottom = `${scHeight + 40}px`
      } else if (feedChat && scHeight > 200) {
        feedChat.style.marginBottom = "240px"
      }
    }
  
    textarea.addEventListener("input", handleKeyUp)
  
    // Cleanup the event listener when the component unmounts
    return () => {
      textarea.removeEventListener("input", handleKeyUp)
    }
  }, []) // Empty dependency array, runs on mount and unmount

  

  return (
    <div className="app">
      <section className={`side-bar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="pt width-sb">
          <div className='width-sb'>
            <div className="sidebar-buttons">
              {isSidebarOpen && (
                <button onClick={createNewChat} className="new-chat-button"><div className="assistant-icon-default"><svg
                xmlns="http://www.w3.org/2000/svg"
                width="41"
                height="41"
                fill="none"
                className="gpt-logo"
                viewBox="0 0 40 40"
              >
                <text x={-9999} y={-9999}>
                  {"ChatGPT"}
                </text>
                <path
                  fill="black"
                  d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744ZM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18Z"
                />
              </svg></div><span className='new-chat-text'>New chat</span><span className="icon-new-chat"><svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                className=""
                viewBox="0 0 22 22"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M16.793 2.793a3.121 3.121 0 1 1 4.414 4.414l-8.5 8.5A1 1 0 0 1 12 16H9a1 1 0 0 1-1-1v-3a1 1 0 0 1 .293-.707l8.5-8.5Zm3 1.414a1.121 1.121 0 0 0-1.586 0L10 12.414V14h1.586l8.207-8.207a1.121 1.121 0 0 0 0-1.586ZM6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4a1 1 0 1 1 2 0v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4a1 1 0 1 1 0 2H6Z"
                  clipRule="evenodd"
                />
              </svg></span></button>
              )}
            </div>
          </div>
        </div>
        {isSidebarOpen && (
          <ul className="history">
          {chatList?.map((chatElement, index) => <li key={index} onClick={() => handleClick(chatElement)} className={lastClickedItem === chatElement ? 'clicked' : ''}><span className="chat-title">{chatElement}</span></li>)}
        </ul>
        )}
        {isSidebarOpen && (
          <div className="bottom-sb">
            <button className="upgrade-button">
              <div className="flex-row">
                <div className="upgrade-icon-bg" id="upg"><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  className=""
                  viewBox="0 0 24 24"
                  >
                  <path
                    fill="currentColor"
                    d="M8.782 8.603 9.819 5.49c.218-.655 1.144-.655 1.362 0l1.037 3.112a5.027 5.027 0 0 0 3.18 3.179l3.111 1.037c.655.218.655 1.144 0 1.362l-3.112 1.037a5.027 5.027 0 0 0-3.179 3.18l-1.037 3.111c-.218.655-1.144.655-1.362 0l-1.037-3.112a5.027 5.027 0 0 0-3.18-3.179l-3.111-1.037c-.655-.218-.655-1.144 0-1.362l3.112-1.037a5.026 5.026 0 0 0 3.179-3.18ZM17.191 3.695l.488-1.464a.338.338 0 0 1 .642 0l.488 1.464c.235.707.79 1.26 1.496 1.496l1.464.488a.338.338 0 0 1 0 .642l-1.464.488c-.707.235-1.26.79-1.496 1.496l-.488 1.464a.338.338 0 0 1-.642 0l-.488-1.464a2.365 2.365 0 0 0-1.496-1.496l-1.464-.488a.338.338 0 0 1 0-.642l1.464-.488a2.365 2.365 0 0 0 1.496-1.496Z"
                  />
                </svg></div>
                <div className="flex-col">
                  <span className="upgrade">Upgrade</span>
                  <span className="upg-hint">Get GPT-4, DALL·E, and more</span>
                </div>
              </div>
            </button>
            <button className="user-container">
              <div className="user-icon-sb"><svg
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                style={{
                  fill: 'white',
                }}
                viewBox="0 0 448 512"
              >
                <path d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3h-91.4z" />
              </svg></div>
              <div className="user-info">UserID</div>
            </button>
          </div>
        )}
      </section>
      <section className="main">
        {!isSidebarOpen && (
            <button className="open-sidebar icon-new-chat-sb-closed" onClick={createNewChat}><span><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            className=""
            viewBox="0 0 22 22"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M16.793 2.793a3.121 3.121 0 1 1 4.414 4.414l-8.5 8.5A1 1 0 0 1 12 16H9a1 1 0 0 1-1-1v-3a1 1 0 0 1 .293-.707l8.5-8.5Zm3 1.414a1.121 1.121 0 0 0-1.586 0L10 12.414V14h1.586l8.207-8.207a1.121 1.121 0 0 0 0-1.586ZM6 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4a1 1 0 1 1 2 0v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4a1 1 0 1 1 0 2H6Z"
              clipRule="evenodd"
            />
          </svg></span></button>
          )}
        <button className="close-sidebar" onClick={toggleSidebar} style={{ left: isSidebarOpen ? '260px' : '0' }}>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width={12} height={40} viewBox='100 50 600 600' className={`svg-arrow ${isSidebarOpen ? "" : "rotate180"}`}>
              <path
                fill="#62626d"
                d="M685.248 919.296a64 64 0 0 0 0-90.496L368.448 512l316.8-316.8a64 64 0 0 0-90.496-90.496L232.704 466.752a64 64 0 0 0 0 90.496l362.048 362.048a64 64 0 0 0 90.496 0z"
              />
            </svg>
          </span>
        </button>
        <ChatFeed currentChat={currentChat} isSidebarOpen={isSidebarOpen} answer={answer} />
        {!currentChat?.length && <IconMainGPT />}
      
        <div className="bottom-section">
          <div className="input-container" id="contact-form">
            <textarea rows="1" value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="Message ChatGPT..." id="autoResizeTextarea"></textarea>
            {!loading && (
              <div id="submit" style={{
                /* Apply disabled styles or any specific styles based on the condition */
                opacity: isTextboxEmpty ? 0.1 : 1,
                pointerEvents: isTextboxEmpty ? 'none' : 'auto',
                  }} onClick={!isTextboxEmpty ? handleSubmitButtonClick : undefined}><span><svg
                  width={24}
                  height={24}
                  fill="none"
                  className="svg-arrow"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m7 11 5-5 5 5m-5 7V7"
                  />
                </svg></span></div>
              )}
              {loading && (
                <div className="circle" id='cancel'>
                  <div className="square" id="cancel"></div>
                </div>
                
              )}
            
            
            
          </div>
          <p className="info">
            ChatGPT can make mistakes. Consider checking important information.
          </p>
        </div>
      </section>
    </div>
  )
}

const IconMainGPT = () => {
  return (
    <div className="container-icon">
      <div className="gpt-icon-main">
        <div className="gpt-icon-main-bg">
          <svg
                xmlns="http://www.w3.org/2000/svg"
                width="41"
                height="41"
                fill="none"
                className="gpt-logo"
                viewBox="0 0 40 40"
            >
                <text x={-9999} y={-9999}>
                  {"ChatGPT"}
                </text>
                <path
                  fill="black"
                  d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744ZM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18Z"
                />
            </svg>
        </div>
      </div>
      <div className="title">How can I help you today?</div>
    </div>
  )
}

const AssistantMessage = ({ receivedMessage }) => {
  const [ sections, setSections ] = useState([])

  useEffect(() => {
    const parts = receivedMessage.split('```')
    setSections(parts)
  }, [receivedMessage])


  return (
    <div style={{ maxWidth: '596px', overflowWrap: 'break-word', textAlign: 'left', }}>
      {sections.map((sectionPart, index) => (
        <div key={index} style={{ padding:'8px' }}>
          {index % 2 === 0 ? (
            sectionPart.split(/\s+/).map((word, wordIndex) => (
              <p key={wordIndex} style={{ display: 'inline', textAlign: 'left !important', marginRight: '5px', }}>
                {word}
              </p>
            ))
          ) : (
            <div key={index} className="max-w-2xl min-w-W bg-C rounded-md overflow-hidden" style={{ margin: '10px', }}>
              <div className="flex justify-between px-4 text-white text-xs items-center height-CB">
                <p className="text-sm">{sectionPart.substring(0, sectionPart.indexOf('\n'))}</p>
                <button className="py-1 inline-flex items-center gap-1">
                  <span className="text-base mt-1">
                    <ion-icon name='clipboard-outline'></ion-icon>
                  </span>
                  Copy code
                </button>
              </div>
              {sectionPart && (
                <SyntaxHighlighter
                  language={sectionPart.substring(0, sectionPart.indexOf('\n'))}
                  style={vscDarkPlus}
                  customStyle={{
                    padding: "25px",
                    backgroundColor: "black",
                    margin: "0 0",
                  }}
                  wrapLongLines={true}
                >
                  {sectionPart.substring(sectionPart.indexOf('\n') + 1)}
                </SyntaxHighlighter>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


const CodeMessage = ({ chatMessage }) => {
  const [ copy, setCopy ] = useState({})

  const copyCode = (codeString) => {
    navigator.clipboard.writeText(codeString)
    setCopy((prevCopyState) => ({
      ...prevCopyState,
      [codeString]: true,
    }))
    setTimeout(() => {
      setCopy((prevCopyState) => ({
        ...prevCopyState,
        [codeString]: false,
      }))
    }, 3000)
  }


  const renderContent = () => {
    if (chatMessage.role === 'assistant' && chatMessage.content !== '') {
      const contentParts = chatMessage.content.split(/```([\s\S]*?)```/)

      const renderedContent = contentParts.map((part, index) => {
        if (index % 2 === 0) {
          const stringWithBold = part.split(/`(.*?)`/g).map((boldText, index2) => {
            return index2 % 2 === 1 ? <strong key={index2} style={{
              fontSize: '13px',
            }}>`{boldText}`</strong> : boldText
          })
          return <div style={{ whiteSpace: 'pre-line' }} className="content" key={index}>{stringWithBold}</div>
        } else {
          const indexOfProgLang = part.indexOf('\n')
          const progLang = part.substring(0, indexOfProgLang)
          const newPart = part.substring(indexOfProgLang + 1)
          return (
            <div key={index} className="max-w-2xl min-w-W bg-C rounded-md overflow-hidden">
              <div className="flex justify-between px-4 text-white text-xs items-center height-CB">
                <p className="text-sm">{progLang}</p>
                <button key={index} className="py-1 inline-flex items-center gap-1" onClick={() => copyCode(newPart)}>
                  <span className="text-base mt-1">
                    <ion-icon name={copy[newPart] ? 'checkmark-sharp' : 'clipboard-outline'}></ion-icon>
                  </span>
                  {copy[newPart] ? 'Copied!' : 'Copy code'}
                </button>
                
              </div>
              <SyntaxHighlighter key={index} language={progLang} style={vscDarkPlus} customStyle={{
                  padding: "25px",
                  backgroundColor:"black",
                  margin: "0 0",
                }}
                wrapLongLines={true}
                >
                {newPart}
              </SyntaxHighlighter>
            </div>
          )
        }
      })

      return <div>{renderedContent}</div>
    }
    return null
  }

  return <div>{renderContent()}</div>
}


const ChatFeed = ({ currentChat, isSidebarOpen, answer }) => {
  return (
    <ul className="feed">
          {currentChat?.map((chatMessage, index) => <li key={index} className={
            chatMessage.role === "user"
            ? "user-item"
            : chatMessage.role === "assistant"
            ? "assistant-item"
            : ""
          } style={{ paddingLeft: isSidebarOpen ? '245px' : '370px' }}>
            <div className="role">
              {chatMessage.role === "user" ? (
                  <div className="user-icon">
                    <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="12"
                  width="12"
                  style={{
                    fill: 'white',
                  }}
                  viewBox="0 0 448 512"
                >
                  <path d="M224 256a128 128 0 1 0 0-256 128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3h-91.4z" />
                </svg>
                  </div>
                ) : chatMessage.role === "assistant" ? (
                  <div className="assistant-icon">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    fill="none"
                    className="icon-md"
                    viewBox="0 0 40 40"
                  >
                    <text x={-9999} y={-9999}>
                      {"ChatGPT"}
                    </text>
                    <path
                      fill="currentColor"
                      d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744ZM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18Z"
                    />
                  </svg>
                  </div>
                ) : null}
            </div>
            <div className="feed-content">
              {chatMessage.role === "user" ? (
                <p className="user-name">You</p>
              ) : chatMessage.role === "assistant" ? (
                <p className="user-name">ChatGPT</p>
              ) : null}
              {chatMessage.role === 'user' && (
                <p className="content">{chatMessage.content}</p>
              )}
              {chatMessage.role === 'assistant' && chatMessage.content === '' && (
                <AssistantMessage receivedMessage={answer} />
              )}
              <CodeMessage key={index} chatMessage={chatMessage} />
              


            </div>
          </li>)}
        </ul>
  )
}




export default App

