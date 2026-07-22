const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


// ======================================
// PROJECTS
// ======================================

export async function getProjects() {

  const res = await fetch(
    `${API_URL}/projects`
  );


  if (!res.ok) {
    throw new Error(
      "Failed to load projects"
    );
  }


  return res.json();

}



export async function getProject(
  projectId: number
) {

  const res = await fetch(
    `${API_URL}/projects/${projectId}`
  );


  if (!res.ok) {
    throw new Error(
      "Failed to load project"
    );
  }


  return res.json();

}



export async function createProject(
  name: string
) {

  const res = await fetch(
    `${API_URL}/projects`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
      }),
    }
  );


  if (!res.ok) {

    throw new Error(
      "Failed to create project"
    );

  }


  return res.json();

}


// ======================================
// ADVERTISEMENTS
// ======================================


export async function getAdvertisements(
  projectId: number
) {

  const res = await fetch(
    `${API_URL}/advertisements/${projectId}`
  );


  if (!res.ok) {

    throw new Error(
      "Failed to load advertisements"
    );

  }


  return res.json();

}




export async function createAdvertisement(
  advertisement: any
) {

  const res = await fetch(
    `${API_URL}/advertisements`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },


      body: JSON.stringify({

        project_id:
          advertisement.project_id,

        text:
          advertisement.text,

        start_time:
          advertisement.start,

        end_time:
          advertisement.end,

      }),
    }
  );


  if (!res.ok) {

    throw new Error(
      "Failed to create advertisement"
    );

  }


  return res.json();

}




export async function updateAdvertisement(
  id: number,
  data: any
) {

  const res = await fetch(
    `${API_URL}/advertisements/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },


      body: JSON.stringify({

        text:
          data.text,

        start_time:
          data.start,

        end_time:
          data.end,

      }),
    }
  );


  if (!res.ok) {

    throw new Error(
      "Failed to update advertisement"
    );

  }


  return res.json();

}





export async function deleteAdvertisement(
  id: number
) {

  const res = await fetch(
    `${API_URL}/advertisements/${id}`,
    {
      method:"DELETE",
    }
  );


  if (!res.ok) {

    throw new Error(
      "Failed to delete advertisement"
    );

  }


  return res.json();

}




// ======================================
// DELETE ALL ADS BY PROJECT
// ======================================


export async function deleteAdvertisementsByProject(
  projectId:number
) {

  const res = await fetch(
    `${API_URL}/advertisements/project/${projectId}`,
    {
      method:"DELETE",
    }
  );


  if(!res.ok){

    throw new Error(
      "Failed to delete advertisements"
    );

  }


  return res.json();

}



// ======================================
// SAVE PROJECT
// ======================================


export async function saveProject(
  projectId:number,
  payload:any
){

  const res = await fetch(
    `${API_URL}/projects/${projectId}/save`,
    {

      method:"POST",

      headers:{
        "Content-Type":"application/json",
      },


      body:JSON.stringify(payload),

    }
  );


  if(!res.ok){

    const error =
      await res.text();


    throw new Error(error);

  }


  return res.json();

}



// ======================================
// TRANSCRIPT LOGS
// ======================================


export async function getLogs(
  projectId:number
){

  const res = await fetch(
    `${API_URL}/upload/logs/${projectId}`
  );


  if(!res.ok){

    throw new Error(
      "Failed to load logs"
    );

  }


  return res.json();

}



// ======================================
// AUDIO UPLOAD
// ======================================


export async function uploadAudio(
  projectId: number,
  file: File,
  keywords: string[],
  startHour: String
) {

  const formData = new FormData();

  formData.append(
    "project_id",
    projectId.toString()
  );

  formData.append(
    "file",
    file
  );

  formData.append(
    "keywords",
    JSON.stringify(keywords)
  );

  formData.append(
    "start_hour",
    startHour.toString()
  );


  const response = await fetch(
    `${API_URL}/upload/`,
    {
      method: "POST",
      body: formData,
    }
  );


  if (!response.ok) {
    throw new Error(
      "Upload failed"
    );
  }


  return response.json();

}



// ======================================
// UPLOAD STATUS
// ======================================


export async function getUploadStatus(
  sessionId:string
){

  const res = await fetch(
    `${API_URL}/upload/status/${sessionId}`
  );


  if(!res.ok){

    throw new Error(
      "Failed to load upload status"
    );

  }


  return res.json();

}