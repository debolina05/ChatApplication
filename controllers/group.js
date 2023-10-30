const { Op } = require("sequelize");
const Group = require("../models/group");
const User = require("../models/user");
const UserGroup = require("../models/usergroup");
const Chat = require("../models/chat");


//--------------------------------------------------CREATE GROUP--------------------------------------------------------------------------------------------
//function , which creates a group into database, by name of group and isAdmin value
exports.createGroup = async (req, res) => {
  try {
    const { name, isAdmin } = req.body;
    const group = await req.user.createGroup({ name });
    const groupuser = await UserGroup.update(
      { isAdmin },
      { where: { groupId: group.id } }
    );
    res.status(201).json({ message: "created successfully", group });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
};



//--------------------------------------------------DELETE GROUP-----------------------------------------------------------------------------------
//function to delete the group from database
exports.deleteGroup = async (req, res) => {
  try {
    const gId = req.params.gId; //getting groupId from query Parameter
    const adminCheck = await UserGroup.findOne({ where: { userId: req.user.id, groupId: gId } }); //checking if user who requested to delete the group is admin or not 
        if (adminCheck.isAdmin === false) {
            return res.status(400).json({ message: " You are not authorized to delete the group " });
        }
    const chats = await Chat.findAll({
      attributes: ["id"],
      where: { groupId: gId },
    }); //finding all the chats of that group by group ID got from query Parameter

    let array = [];
    chats.forEach((chat) => {
      array.push(chat.id);
    });

    const chatResponse = await Chat.destroy({ where: { id: array } });
    const GroupResponse = await Group.destroy({ where: { id: gId } });
    res.status(200).json({ message: "Group Deleted!!!" });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
};



//--------------------------------------------------GET GROUPS----------------------------------------------------------------------------------
//fetching groups from group tables
exports.getGroups = (req, res) => {
  req.user
    .getGroups({ attributes: ["id", "name"] })
    .then((groups) => {
      res.status(200).json({ success: true, groups });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "server error" });
    });
};




//-----------------------------------------------GET USERS OF PARTICULAR GROUP----------------------------------------------------------------------------------
exports.getUsers = async (req, res) => {
  try {
    const gId = req.query.gId; //fetching groupId from req.query
    if (gId != null) {
      const ress = await UserGroup.findAll({
        attributes: ["userId"],
        where: { groupId: gId },
      }); //finding all Ids associated with groupId

      //Extracting userIds from the results and storing them in an array
      let userIdArray = [];
      ress.forEach((id) => {
        userIdArray.push(id.userId);
      });

      //Retrieving user data for the extracted userIds.
      const userData = await User.findAll({
        attributes: ["id", "name", "email"],
        include: [{ model: Group, where: { id: gId } }],
        where: { id: userIdArray },
      });

      res.status(200).json({ userData });
    } else if (gId == null) {
      const user = await User.findAll({
        attributes: ["id", "name", "email"],
        where: { id: { [Op.ne]: req.user.id } },
      });

      res.status(200).json({ success: true, user });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ success: false, message: "error" });
  }
};


//-------------------------------------------------ADDING USERS TO GROUP-----------------------------------------------------------------------
exports.addUserToGroup = async (req, res) => {
  try {
    const { groupId, userId, email, isAdmin } = req.body;
    //for checking current user if admin
    const adminCheck = await UserGroup.findOne({
      where: { userId: req.user.id, groupId: groupId },
    }); //to check if adder is admin
    console.log(adminCheck);
    if (adminCheck.isAdmin === false) {
      return res.status(400).json({ message: "You are not an admin" });
    }

    // for adding users to group
    const userToAdd = await User.findOne({ where: { email } });
    const userGroup = await UserGroup.create({
      userId: userToAdd.id,
      groupId: groupId,
    });
    if (isAdmin === true) {
      const userGroupResponse = await UserGroup.update(
        { isAdmin: isAdmin },
        { where: { userId: userToAdd.id, groupId: groupId } }
      );
    }
    res.status(201).json({ message: "added user to the group", userGroup });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "user already exists in the group" });
  }
};



//----------------------------------------------------REMOVE USER FROM GROUP------------------------------------------------------------------
exports.removeUser = async (req, res) => {
  try {
    const { groupId, email } = req.body;
    console.log(req.body);

    console.log(">>>>>>>req.user.id ", req.user.id);

    //for checking current user if admin
    const adminCheck = await UserGroup.findOne({
      where: { userId: req.user.id, groupId: groupId },
    });
    // console.log(adminCheck);
    console.log(">>>>>>isAdmin Check", adminCheck.isAdmin);
    if (adminCheck.isAdmin === false) {
      return res.status(400).json({ message: "You are not an admin" });
    }

    console.log(">>>>After isAdmin check");
    const userToRemove = await User.findOne({ where: { email } });
    // console.log(userToRemove)
    const result = await UserGroup.destroy({
      where: { userId: userToRemove.id, groupId: groupId },
    });
    // console.log('>>>>>>',result)
    if (result == 0)
      return res.status(404).json({ message: "User not present in the group" });
    res.status(200).json({ message: "User removed from the group" });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};



//-------------------------------------------------------MAKE ADMIN--------------------------------------------------------------------------
exports.makeAdmin = async (req, res) => {
  try {
    const { email, groupId } = req.body;
    //getting name not email

    console.log(">>>>>>>>>>>>>Email and groupID ", email);
    console.log(">>>>>>>>>>>>>Email and groupID ", groupId);

    const user = await User.findOne({ where: { name: email } });

    await UserGroup.update(
      { isAdmin: true },
      { where: { userId: user.id, groupId: groupId } }
    );
    res.status(200).json({ message: "user is now admin" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
};
