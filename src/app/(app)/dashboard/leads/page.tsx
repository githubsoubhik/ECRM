"use client";

import { useState } from "react";


interface Lead {

    id:number;

    name:string;

    email:string;

    phone:string;

    source:string;

    status:string;

    priority:string;

}



export default function LeadsPage(){


const [leads,setLeads] = useState<Lead[]>([


    {
        id:1,
        name:"Sourav Das",
        email:"sourav@gmail.com",
        phone:"9876543210",
        source:"Website",
        status:"New",
        priority:"High"
    },


    {
        id:2,
        name:"Ananya Roy",
        email:"ananya@gmail.com",
        phone:"8765432109",
        source:"Facebook Ads",
        status:"Contacted",
        priority:"Medium"
    },


    {
        id:3,
        name:"Rahul Sen",
        email:"rahul@gmail.com",
        phone:"7654321098",
        source:"Google Ads",
        status:"Converted",
        priority:"Low"
    },


    {
        id:4,
        name:"Priya Sharma",
        email:"priya@gmail.com",
        phone:"9123456780",
        source:"Instagram",
        status:"Pending",
        priority:"High"
    }


]);





const deleteLead=(id:number)=>{


setLeads(

leads.filter(
(lead)=>lead.id !== id
)

);


};




return(


<div className="lead-container">



<div className="lead-header">


<div>

<h1>
Leads
</h1>

<p>
Manage and track your business leads.
</p>

</div>



<button className="add-lead-btn">

+ Add Lead

</button>


</div>





<div className="lead-table-wrapper">


<table className="lead-table">


<thead>

<tr>

<th>
Name
</th>


<th>
Email
</th>


<th>
Phone
</th>


<th>
Source
</th>


<th>
Status
</th>


<th>
Priority
</th>


<th>
Action
</th>


</tr>

</thead>





<tbody>


{

leads.map((lead)=>(


<tr key={lead.id}>


<td>
{lead.name}
</td>


<td>
{lead.email}
</td>


<td>
{lead.phone}
</td>


<td>
{lead.source}
</td>



<td>

<span

className={`lead-status ${lead.status.toLowerCase()}`}

>

{lead.status}

</span>


</td>



<td>

<span

className={`priority ${lead.priority.toLowerCase()}`}

>

{lead.priority}

</span>


</td>



<td>


<button className="lead-edit-btn">

Edit

</button>



<button

className="lead-delete-btn"

onClick={()=>deleteLead(lead.id)}

>

Delete

</button>


</td>



</tr>


))


}



</tbody>



</table>



</div>



</div>


)


}