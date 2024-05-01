import { useEffect, useRef, useState } from "react";
import {Box, Button, Container, VStack, Input, HStack} from "@chakra-ui/react"
import Message from "./Components/Message";
import { onAuthStateChanged, getAuth ,GoogleAuthProvider, signInWithPopup, signOut} from "firebase/auth"
import {app} from "./firebase"
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = ()=>{
  const provider = new GoogleAuthProvider();
  
  signInWithPopup(auth, provider);
}
const logoutHandler = ()=>signOut(auth);

function App() {

  const [user,setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const divForScroll = useRef(null);

  const submitHandler = async (e)=>{
    e.preventDefault();
    try {
      setMessage("");
      await addDoc(collection(db,"Messages"), {
        text:message,
        uid:user.uid,
        uri:user.photoURL,
        createdAt: serverTimestamp()
      });
      divForScroll.current.scrollIntoView({behavior:"smooth"});
    } catch (error) {
      alert(error);
    }
  }

  useEffect(()=>{

    const q = query(collection(db,"Messages"),orderBy("createdAt", "asc"));

    const unsubscribe = onAuthStateChanged(auth, (data)=>{
      setUser(data)
    });

    const unsubscribeForMessage = onSnapshot(q,(snap)=>{
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return {id, ...item.data()};
        })
      );
    });

    return ()=>{
      unsubscribe();
      unsubscribeForMessage();
    };
  },[]);

  return(
    <Box bg={"red.50"}>
    {
      user ? 
      (<Container h={"100vh"} bg = {"white"} >
        <VStack h={"full"} padding={"4"}>
          <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
          Logout
          </Button>

          <VStack h={"full"} w={"full"} overflowY={"auto"} css = {{
            "&::-webkit-scrollbar" : {
              display: "none",
            },
          }} >
            {
              messages.map( m => (
                <Message 
                  key={m.id}
                  text= {m.text} 
                  uri= {m.uri} 
                  user= {m.uid === user.uid?"me":"other"} />
                )
              )
            }  
          <div ref = {divForScroll}></div>
          </VStack>



          <form onSubmit={submitHandler} style={{width:"100%"}}>
            <HStack>
              <Input value={message} onChange={(e)=>{setMessage(e.target.value)}} placeholder="Enter a message..." />
              <Button colorScheme="purple" type="submit">Send</Button>
            </HStack>
          </form>
        </VStack>
      </Container>):(
        <VStack h={"100vh"} justifyContent={"center"}>
          <Button onClick={loginHandler} colorScheme="purple">
            Sign In With Google
          </Button>
        </VStack>
      )
    }
    </Box>
      
  )
}

export default App;
