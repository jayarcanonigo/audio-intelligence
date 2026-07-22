"use client";

type TimeEditorProps = {
  time: string;
  displayTime: (time: string) => string;

  onChange: (
    part: "minute" | "second",
    value: string
  ) => void;
};

export default function TimeEditor({
  time,
  displayTime,
  onChange,
}: TimeEditorProps) {

  const [minute = "00", second = "00"] =
    displayTime(time).split(":");


  const handleInput = (
    part: "minute" | "second",
    value: string
  ) => {

    // only numbers
    let clean = value.replace(/\D/g, "");

    // max 2 digits
    clean = clean.slice(0, 2);


    onChange(
      part,
      clean
    );
  };


  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
      }}

      onClick={(e)=>e.stopPropagation()}
      onMouseDown={(e)=>e.stopPropagation()}
      onPointerDown={(e)=>e.stopPropagation()}
    >

      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={minute}
        onChange={(e)=>
          handleInput(
            "minute",
            e.target.value
          )
        }
        style={{
          width:45,
          textAlign:"center",
          padding:"5px",
          border:"1px solid #d1d5db",
          borderRadius:6,
        }}
      />


      <span>
        :
      </span>


      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={second}
        onChange={(e)=>
          handleInput(
            "second",
            e.target.value
          )
        }
        style={{
          width:45,
          textAlign:"center",
          padding:"5px",
          border:"1px solid #d1d5db",
          borderRadius:6,
        }}
      />

    </div>
  );
}