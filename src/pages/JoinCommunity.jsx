import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { databases } from "../api/appwriteConfig";
import { useAuth } from "../context/AuthContext";

const JoinCommunity = () => {
  const { groupId: paramGroupId } = useParams();
  const [searchParams] = useSearchParams();
  const queryGroupId = searchParams.get("groupId");
  const groupId = paramGroupId || queryGroupId;

  console.log("Group ID:", groupId);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        // Check if user is logged in
        if (!user) {
          const redirectPath = groupId
            ? `/joinGroup?groupId=${groupId}`
            : location.pathname + location.search;

          navigate("/login", {
            state: {
              from: redirectPath,
              message: "Please login to join this community"
            }
          });
          return;
        }

        // Validate groupId
        if (!groupId) {
          setError("Invalid group link");
          setLoading(false);
          return;
        }

        // Verify environment variables are set
        const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
        const collectionId = import.meta.env.VITE_APPWRITE_GROUPS_COLLECTION_ID;

        if (!databaseId || !collectionId) {
          console.error("Missing environment variables:", {
            databaseId,
            collectionId
          });
          throw new Error("Configuration error - please contact support");
        }

        // Fetch group details
        const response = await databases.getDocument(
          databaseId,
          collectionId,
          groupId
        );

        if (!response) {
          throw new Error("Group not found");
        }

        setGroup(response);

        // Check if current user is already a member
        if (response.members && Array.isArray(response.members)) {
          setIsMember(response.members.includes(user.$id));
        } else {
          setIsMember(false);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching group:", err);
        setError(err.message.includes("Missing required parameter")
          ? "Configuration error - please contact support"
          : err.message || "Failed to fetch group details");
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, user, navigate, location.pathname, location.search]);


  const handleJoinGroup = async () => {
    try {
      if (!group || !user) return;

      // Create updated members array
      const currentMembers = Array.isArray(group.members) ? group.members : [];
      const updatedMembers = [...currentMembers, user.$id];

      // Update document in Appwrite
      const updatedGroup = await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_GROUPS_COLLECTION_ID,
        group.$id,
        {
          members: updatedMembers
        }
      );

      // Update local state with the response from Appwrite
      setGroup(updatedGroup);
      setIsMember(true);

      // Optionally navigate to group page or show success
      navigate(`/joinGroup/${groupId}`);
    } catch (err) {
      console.error("Error joining group:", err);
      setError("Failed to join group. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-white">{error}</div>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-white underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-white">Group not found</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black" style={{ marginTop: "-100px" }}>
      <div className="bg-white rounded-md shadow-lg w-100 h-75 text-center p-4 max-w-md mx-auto">
        {/* Group Image */}
        <div
          className="bg-gray-300 rounded-full mx-auto flex items-center justify-center overflow-hidden"
          style={{ width: "80px", height: "80px", margin: "18px auto 10px" }}
        >
          {group.groupImageId ? (
            <img
              src={`${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_GROUP_PROFILE_PICS_BUCKET_ID}/files/${group.groupImageId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT}`}
              alt="Group"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-500">No Image</span>
          )}
        </div>

        {/* Group Title */}
        <h2 className="text-lg font-bold text-black m-0">{group.groupName}</h2>
        <p className="text-xs text-gray-500 m-0" style={{ marginBottom: "16px" }}>
          {group.eventname}
        </p>

        {/* Group Description (if exists) */}
        {group.groupDescription && (
          <p className="text-sm text-gray-700 mb-4">{group.groupDescription}</p>
        )}

        {/* Event Details */}
        <div className="text-left mb-4">
          <p className="text-sm font-semibold">Event Details:</p>
          <p className="text-xs">
            <span className="font-medium">Date:</span> {new Date(group.eventDate).toLocaleDateString()}
          </p>
          <p className="text-xs">
            <span className="font-medium">Location:</span> {group.eventLocation}
          </p>
        </div>

        {/* Current Members Section */}
        <div style={{ marginBottom: "20px" }}>
          <div className="flex justify-between items-center mx-5">
            <p className="text-sm font-semibold text-black">Current Members</p>
            <span className="text-xs text-gray-500 font-bold bg-gray-200 rounded-full px-2 py-1">
              {group.members ? group.members.length : 0}
            </span>
          </div>

          {/* Member Circles Below */}
          <div className="flex justify-start items-center gap-2 mx-5 mt-3">
            {group.members && group.members.slice(0, 5).map((memberId, index) => (
              <div
                key={index}
                className="bg-gray-300 rounded-full"
                style={{ width: "21px", height: "21px" }}
                title={`Member ${index + 1}`}
              ></div>
            ))}
            {group.members && group.members.length > 5 && (
              <span className="text-xs">+{group.members.length - 5} more</span>
            )}
          </div>
        </div>

        {/* Join Button or Member Status */}
        {isMember ? (
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 text-gray-700 rounded-lg mx-5 py-2 w-[calc(100%-40px)] text-center">
              Already a Member
            </div>
            <p className="text-white text-sm mt-2 text-center mx-7">
              You've successfully joined the group! Open the app to start chatting with your group members.
            </p>
          </div>
        ) : (
          <button
            onClick={handleJoinGroup}
            className="bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 mx-5 w-[calc(100%-40px)] py-2"
          >
            Join Group
          </button>
        )}
      </div>
    </div>
  );
};

export default JoinCommunity;