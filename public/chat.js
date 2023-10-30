//getting the value of tokens stored into localStorage from login frontEnd
const token = localStorage.getItem("token");
const name = localStorage.getItem("name");
const userId = localStorage.getItem("userId");

//custom axios
const userAxios = axios.create({
  baseURL: "http://localhost:3000",
  headers: { Authorization: `Bearer ${token}` },
});


//-----------------------------------NAVBAR- NAME & GROUPNAME & LOGOUT--------------------------------------------------------
{ 
  //block to select groupName from localStorage if exists.
  document.getElementById("login-name").innerHTML = `${name}`;
  const currentGroup = document.getElementById("current-group-name");
  if (localStorage.getItem("groupName") != null) {
    currentGroup.innerHTML = `${localStorage.getItem("groupName")}`;
  } else {
    currentGroup.innerHTML = `Choose a group`;
  }
  
  function logout() {
    console.log(">>>>getting inside logout function");
    localStorage.clear();
    window.location.href = "./login.html";
  }
}


{
//---------------------------------------------------GET GROUPS---------------------------------------------------------------------------------
  userAxios
    .get("/get-groups")
    .then((res) => {
      const groupListDiv = document.getElementById("group-list");
      groupListDiv.innerHTML = "";
      res.data.groups.forEach((group) => {
        groupListDiv.innerHTML += `
            <li id="${group.id}">
                <span>${group.name}</span>
                <button id="show-users">Show Users</button>
                <button id="change-group-btn" class="group-btn">Enter Chat</button>
                <button id="delete-group-btn" class="group-btn">Delete Group</button>
            </li>
            `;
      });
    })
    .catch((err) => console.log(err));


//-----------------------------------FOR CREATING GROUPS--------------------------------------------------------------------------------------
  function createGroup(event) {
    event.preventDefault();//prevents from auto submit
    const name = document.getElementById("create-group-input").value;
    userAxios
      .post("/create-group", { name, isAdmin: true })
      .then((res) => {
        console.log(res.data);
        const groupId = res.data.group.id;
        localStorage.setItem("groupId", groupId);
        window.location.reload();
      })
      .catch((err) => console.log(err));
  }


//-----------------------------------------CHANGE GROUP----------------------------------------------------------------------
  //event listener to change/delete groups
  document
    .getElementById("group-list-wrapper")
    .addEventListener("click", (e) => {
      if (e.target.id === "change-group-btn") {
        //if user press change group button
        const gId = e.target.parentNode.id;
        const gName = e.target.parentNode.children[0].innerText;
        console.log(gId, gName);
        localStorage.setItem("groupId", gId);
        localStorage.setItem("groupName", gName);
        localStorage.setItem("localMsg", "[]");
        window.location.reload();
      }


//----------------------------------------FOR DELETING GROUPS---------------------------------------------------------------
      if (e.target.id === "delete-group-btn") {
        const gId = e.target.parentNode.id;
            console.log(gId)
            if (confirm("Are you sure?")) {
                userAxios
                    .delete(`/delete-group/${gId}`) //delete api will be called to delete the group
                    .then((res) => {
                        console.log(res.data);
                        localStorage.removeItem("groupId"); //group will also be deleted from localStorage
                        alert(`Group deleted successfully`); //Alert to notify user that group has been deleted
                        window.location.reload();
                    })
                    .catch((err) => {
                        alert(`You are not authorized to delete the group`);
                        console.log(err.response.data)});
                        
            }
      }

//----------------------------------------SHOW USERS OF PARTICULAR GROUP----------------------------------------------------------------------
      if (e.target.id === "show-users") {
        const gId = e.target.parentNode.id;
        userAxios
          .get(`/get-users/?gId=${gId}`) //show all the users inside the group by calling the get-users api
          .then((res) => {
            document.getElementById("users-inside-group").innerHTML = "";
            res.data.userData.forEach((user) => {
              document.getElementById("users-inside-group").innerHTML += `
                        <li id="${user.groups[0].id}">
                        <span>${user.name}</span>
                        <span style="display: none;">${user.email}</span>
                            <button id="remove-user-btn" class="user-btn">Remove</button>
                            <button id="make-admin-btn">Make Admin</button>
                        </li> `; //showing userName at show all users list.
            });
          })
          .catch((err) => console.log(err));
      }


//----------------------------------------------REMOVE USER FROM GROUP---------------------------------------------------------------------------
      if (e.target.id === "remove-user-btn") {
        const obj = {
          email: e.target.parentNode.children[1].innerText, //getting email of the user which admin want to remove
          groupId: e.target.parentNode.id, //getting groupID
        };
        //console.log(obj);

        if (confirm("Are you sure?")) {
          userAxios
            .post("/remove-user", obj) //sending object to backend api to delete user
            .then((res) => {
              alert(`${obj.email} removed from the group`);
              window.location.reload();
            })
            .catch((err) => {
              console.log(err.response);
              alert(`You Are not an Admin`);
            });
        }
      }

//---------------------------------------------------MADE ADMIN-------------------------------------------------------------------
      if (e.target.id === "make-admin-btn") {
        //to make admin
        const obj = {
          email: e.target.parentNode.children[0].innerText, //getting email of user from parentNode
          groupId: e.target.parentNode.id, //getting groupId
        };
        userAxios
          .post("/make-admin", obj) //sending object to backend API to make user an admin by its email ID
          .then((res) => {
            alert("The user is now an Admin");
            console.log(res);
          })
          .catch((err) => console.log(err));
      }
    });
}


//--------------------------------------------GET USER LIST-------------------------------------------------------------
{
  userAxios
    .get("/get-users") //api call to get all the users present into DB
    .then((res) => {
      const userListDiv = document.getElementById("user-list");
      userListDiv.innerHTML = "";
      res.data.user.forEach((user) => {
        userListDiv.innerHTML += `
              <li id='user-${user.id}' class="user-list-inside" style="padding: 5px 0;" user-list-li>
              <i class="fa fa-user"></i>
              <span>${user.name}</span>
              <span style="display:none;">${user.email}</span>
              <label for="accept"><small></small></label>
              <input type="checkbox" id="accept" style="visibility: hidden">
              <button id="add-user-btn" class="user-btn">Add</button>
              </li> `;
      });
    })
    .catch((err) => console.log(err.response));


//------------------------------------------CHOOSE GROUP FIRST---------------------------------------------------------
  document.getElementById("user-list").addEventListener("click", (e) => {
    //for adding/removing users
    const email = e.target.parentNode.children[2].innerText;

    const isAdmin = e.target.parentNode.children[3].checked;

    if (localStorage.getItem("groupId") == null) {
      return alert("Please select a group first");
    }
    const obj = {
        userId: localStorage.getItem("userId"), //getting email of user
        groupId: localStorage.getItem("groupId"),
        email:email,
        isAdmin:isAdmin 
    };

 //-----------------------------------------------ADD USER IN GROUP---------------------------------------------------------------
    if (e.target.id === "add-user-btn") {
        
      userAxios
        .post("/add-user", obj)
        .then((res) => {
          console.log(res.data);
          alert(`user added to the group`);
          window.location.reload();
        })
        .catch((err) => {
          console.log(err.response.data);
          alert(`You are not an Admin Or User Already Exists`);
        });
    }
  });
}



//---------------------------------------------------CHATS---------------------------------------------------------------------
{
  //if we have any messages stored into our localStorage already..
  let localMsg = JSON.parse(localStorage.getItem("localMsg")); //getting array of messages from localMsg, if present, else
  let lastId;
  if (localMsg == null) {
    lastId = 0; //last id = 0 if localStorage localMsg has no value present.
  }
  if (localMsg.length > 0) {
    lastId = localMsg[localMsg.length - 1].id; //If there are messages in localMsg,
    //it retrieves the ID of the last message by accessing localMsg[localMsg.length - 1].id and assigns it to the lastId variable.
    // to keep track of ID of last message.
    
  }
  const groupId = localStorage.getItem("groupId");


//-----------------------------------------------GET-CHAT--------------------------------------------------------------
  if (localStorage.getItem("groupId") != null) {
    setInterval(() => {
        userAxios
            .get(`/get-chats?id=${lastId}&gId=${groupId}`)
            .then((response) => {
                //localstorage
                let retrivedMsg = localMsg.concat(response.data.chat);
                //deleting old messages from local storage
                if (retrivedMsg.length > 100) {
                    for (let i = 0; i < retrivedMsg.length - 100; i++) //loops until 100 so only 100 or lesser messages stays in retrivedMsg
                        retrivedMsg.shift(); //removing first element from an array,
                }
                //retrived array is then stored back into localMsg, so to fetch faster than DB.
                localStorage.setItem("localMsg", JSON.stringify(retrivedMsg));
                const div = document.getElementById("group-chat-receive-box");
                div.innerHTML = "";
                retrivedMsg.forEach((chat) => {
                    div.innerHTML += `<div id="${chat.id}>"><span><b>${chat.name} :  </b></span><span>${chat.message}</span></div>`;
                });
            })
            .catch((err) => console.log(err.response));
    }, 1000)
  }

  //------------------------------------------------SEND IMAGE FILE----------------------------------------------------------
function sendFile(event) {
    console.log("send file is getting triggered");
    event.preventDefault();
    const fileInput = document.getElementById("file-input");
    const formData = new FormData();//FormData is an interface
    //It returns an object consisting of the data filled in the HTML form as name-value pairs

    //its a common way to send bundle of data to the server from html file
    formData.append("image", fileInput.files[0]);//(name, value,filename)

    userAxios
      .post("/upload", formData)
      .then((response) => {
        console.log('285')
        console.log("checking response from /upload");
        if (response.status === 200) {
          const fileUrl = response.data.fileURL;
          const downloadLink = `<a href="${fileUrl}"download>Open</a>`;
          console.log(">>>download Link:", downloadLink);
          const obj = {
            message: downloadLink, // Send the download link for the image
            name: name,
            groupId: localStorage.getItem("groupId"),
          };

          console.log(">>>>> before userAxios postchat", obj);
          userAxios
            .post("/post-chat", obj)
            .then((res) => {
              console.log(res);
              console.log(">>>>>sending file into post chat, ", obj);
            })
            .catch((err) => console.log(err));

          const div = document.getElementById("group-chat-receive-box");
          div.innerHTML += `
              <div>
                <span style="color:grey;"><b>${name}:</b></span>
                <span>${downloadLink}</span>
              </div>`;

          // Clear the input and scroll to the bottom
          fileInput.value = "";
          div.scrollTop = div.scrollHeight;
        }
      })
      .catch((err) => {
        console.log(err.response);
      });
  }



//-----------------------------------------------POST CHAT--------------------------------------------------------------
  function sendGroupMsg(event) {
    event.preventDefault();

    if (localStorage.getItem("groupId") == null) {
      //if groupID in localStorage is null, we ask user to first select the group
      alert("Select a group first");
      document.getElementById("group-chat-input").value = "";
    } else {
      const input = document.getElementById("group-chat-input").value;
      const obj = {
        message: input,
        name: name,
        groupId: localStorage.getItem("groupId"),
      };

      userAxios
        .post("/post-chat", obj)
        .then((res) => console.log(res))
        .catch((err) => console.log(err));

      // Display the sent message or image in the chat box
      const div = document.getElementById("group-chat-receive-box");
      const chatMessageDiv = document.createElement("div");
      chatMessageDiv.innerHTML = `
            <span style="color:green;"><b>${name}:</b></span><span>${input}</span>`;
      div.appendChild(chatMessageDiv);

      // Clear the input and scroll to the bottom
      document.getElementById("group-chat-input").value = "";
      div.scrollTop = div.scrollHeight;
    }
  }
}


