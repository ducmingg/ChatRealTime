import {
  useContext,
  useState,
  useEffect,
  createContext,
  useRef,
  useCallback,
} from "react";

const WebSocketContext = createContext();

const WebSocketProvider = ({ children }) => {
  const [connection, setConnection] = useState(false);
  const wsRef = useRef(null);
  const [response, setResponse] = useState(null);
  const [name, setName] = useState(null);
  const [users, setUsers] = useState(null);
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    const ws = new WebSocket("ws://140.238.54.136:8080/chat/chat");
    wsRef.current = ws;
    setConnection(true);
    ws.addEventListener("open", () => {
      console.log("WebSocket connection opened");
      
    });

    ws.addEventListener("message", (event) => {
      const res = JSON.parse(event.data);
      setResponse(res);
      console.log("websocket said:", res);
    });

    ws.addEventListener("close", () => {
      console.log("Connection is closed");
      setConnection(false);
    });

    return () => {
      ws.close();
    };
  }, []);

  const SendMessage = (msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const RegisterContext = (username, password) => {
    const register_msg = {
      action: "onchat",
      data: {
        event: "REGISTER",
        data: {
          user: username,
          pass: password,
        },
      },
    };
    SendMessage(register_msg);
  };

  const LoginContext = (username, password) => {
    const login_msg = {
      action: "onchat",
      data: {
        event: "LOGIN",
        data: {
          user: username,
          pass: password,
        },
      },
    };
    SendMessage(login_msg);
  };

  const LogoutContext = () => {
    const logout_msg = {
      action: "onchat",
      data: {
        event: "LOGOUT",
      },
    };
    SendMessage(logout_msg);
  };

  const Relogin = useCallback(
    (re_login_code) => {
      return new Promise((resolve) => {
        const relogin_msg = {
          status: "success",
          event: "RE_LOGIN",
          data: {
            RE_LOGIN_CODE: re_login_code,
          },
        };
        SendMessage(relogin_msg);
        if (connection) {
          wsRef.current.addEventListener("message", (event) => {
            const res = JSON.parse(event.data);
            if (res.status === "success" && res.event === "RE_LOGIN") {
              localStorage.setItem("login_code", res.data.RE_LOGIN_CODE);
              setFlag(true);
            }
            resolve(res.data);
            wsRef.current.removeEventListener("message", this);
          });
        }
      });
    },
    [connection, flag]
  );

  const GetUserList = useCallback(() => {
    return new Promise((resolve) => {
      const getuser_msg = {
        action: "onchat",
        data: {
          event: "GET_USER_LIST",
        },
      };
      SendMessage(getuser_msg);
      if (connection) {
        wsRef.current.addEventListener("message", (event) => {
          const res = JSON.parse(event.data);
          resolve(res.data);
          wsRef.current.removeEventListener("message", this);
        });
      }
    });
  }, [connection, flag]);

  const CreateRoom = (roomName) => {
    const create_room_msg = {
      action: "onchat",
      data: {
        event: "CREATE_ROOM",
        data: {
          name: roomName,
        },
      },
    };
    SendMessage(create_room_msg);
  };

  const GetChatPeople = useCallback(
    (people) => {
      return new Promise((resolve) => {
        const getChatPeople_msg = {
          action: "onchat",
          data: {
            event: "GET_PEOPLE_CHAT_MES",
            data: {
              name: people,
              page: 1,
            },
          },
        };
        SendMessage(getChatPeople_msg);
        if (connection) {
          wsRef.current.addEventListener("message", (event) => {
            const res = JSON.parse(event.data);
            resolve(res.data);
            wsRef.current.removeEventListener("message", this);
          });
        }
      });
    },
    [connection]
  );

  const JoinRoom = (roomName) => {
    const join_room_msg = {
      action: "onchat",
      data: {
        event: "JOIN_ROOM",
        data: {
          name: roomName,
        },
      },
    };
    SendMessage(join_room_msg);
  };

  const value = {
    connection,
    response,
    name,
    users,
    flag,
    Relogin,
    GetUserList,
    setResponse,
    setName,
    RegisterContext,
    LoginContext,
    LogoutContext,
    CreateRoom,
    JoinRoom,
    GetChatPeople,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export { WebSocketContext, WebSocketProvider };
