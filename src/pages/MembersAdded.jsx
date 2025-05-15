import React from "react";
import RightImage from "../assets/RightImage.png";
import { Link } from "react-router-dom";

const MembersAdded = () => {
  return (
    <>
      <div
        className="flex justify-center items-center min-h-screen bg-black"
        style={{ marginTop: "-100px" }}
      >
        <div className="bg-white rounded-md shadow-lg w-100 h-85 text-center">
          {/* Replaced Circle Image with RightImage */}
          <img
            src={RightImage}
            alt="Right Image"
            className="mx-auto"
            style={{ width: "170px", margin: "25px auto 10px" }}
          />

          {/* Group Title */}
          <div className="flex flex-col gap-3 items-center">
            <div className="text-left">
              <h2
                className="text-lg font-bold text-black"
                style={{ marginBottom: "12px" }}
              >
                Members Added!
              </h2>
              <p
                className="text-xs text-gray-800"
                style={{ marginBottom: "60px" }}
              >
                You've successfully joined the <br /> group! Proceed with the
                app to <br /> take the next step.
              </p>
            </div>
          </div>

          {/* Join Button */}
          <Link to="/">
            <button
              className="bg-black text-white rounded-lg cursor-pointer"
              style={{
                padding: "4px",
                marginLeft: "40px",
                marginRight: "40px",
                width: "calc(100% - 80px)",
              }}
            >
              Go Back
            </button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default MembersAdded;
