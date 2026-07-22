"use client";

import TimeEditor from "./TimeEditor";
import ActionButtons from "./ActionButtons";

type SegmentTableProps = {
  results: any[];

  selectedResultId: number | null;
  editingId: number | null;
  editText: string;

  downloading: boolean;

  setSelectedResultId: (id: number | null) => void;
  setEditText: (value: string) => void;

  onPlay: (row: any) => void;

  onTimeChange: (
    id: number,
    field: "start" | "end",
    part: "minute" | "second",
    value: string
  ) => void;

  onEdit: (row: any) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;

  onDownload: (row: any) => void;
  onRemove: (id: number) => void;

  displayTime: (time: string) => string;
};


export default function SegmentTable({
  results,
  selectedResultId,
  editingId,
  editText,
  downloading,

  setSelectedResultId,
  setEditText,

  onPlay,
  onTimeChange,

  onEdit,
  onSaveEdit,
  onCancelEdit,

  onDownload,
  onRemove,

  displayTime,

}: SegmentTableProps) {


  const sortedResults = [...results].sort(
    (a, b) =>
      (a.start || "99:99:99")
        .localeCompare(b.start || "99:99:99")
  );


  return (
    <div>

      <table
        style={{
          width: "100%",
        }}
      >

        <thead>
          <tr>

            <th style={{width:"70%"}}>
              Transcript
            </th>

            <th>
              Start
            </th>

            <th>
              End
            </th>

            <th>
              Actions
            </th>

          </tr>
        </thead>


        <tbody>

        {sortedResults.map((r)=> (

          <tr
            key={r.id}
            style={{
              background:
                selectedResultId === r.id
                ? "#f8fafc"
                : undefined
            }}
          >


            {/* TEXT */}
            <td
              onClick={()=>{
                setSelectedResultId(r.id);
                onPlay(r);
              }}
            >

              {
                editingId === r.id ?

                <textarea
                  value={editText}
                  onChange={(e)=>
                    setEditText(e.target.value)
                  }
                />

                :

                <div>
                  {r.text}
                </div>
              }

            </td>



            {/* START */}
            <td
              onClick={(e)=>e.stopPropagation()}
            >

              <TimeEditor
                time={r.start}
                displayTime={displayTime}
                onChange={(part,value)=>
                  onTimeChange(
                    r.id,
                    "start",
                    part,
                    value
                  )
                }
              />

            </td>



            {/* END */}
            <td
              onClick={(e)=>e.stopPropagation()}
            >

              <TimeEditor
                time={r.end}
                displayTime={displayTime}
                onChange={(part,value)=>
                  onTimeChange(
                    r.id,
                    "end",
                    part,
                    value
                  )
                }
              />

            </td>



            {/* ACTION */}
            <td>

              <ActionButtons

                editing={
                  editingId === r.id
                }

                downloading={
                  downloading
                }

                onSave={()=>
                  onSaveEdit(r.id)
                }

                onCancel={
                  onCancelEdit
                }

                onDownload={()=>
                  onDownload(r)
                }

                onEdit={()=>
                  onEdit(r)
                }

                onRemove={()=>
                  onRemove(r.id)
                }

              />

            </td>


          </tr>

        ))}

        </tbody>


      </table>



      {
        results.length === 0 &&
        (
          <p style={{
            opacity:0.5,
            marginTop:10
          }}>
            No segments selected yet
          </p>
        )
      }

    </div>
  );
}