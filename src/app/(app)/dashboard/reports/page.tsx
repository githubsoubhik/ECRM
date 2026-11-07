"use client";


import { useState } from "react";



interface Report {


    id:number;

    month:string;

    revenue:string;

    Clients:number;

    projects:number;

    leads:number;

    status:string;


}





export default function ReportsPage(){



const [reports,setReports] = useState<Report[]>([



    {

        id:1,

        month:"January 2026",

        revenue:"₹4,50,000",

        Clients:45,

        projects:12,

        leads:120,

        status:"Completed"

    },



    {

        id:2,

        month:"February 2026",

        revenue:"₹6,20,000",

        Clients:60,

        projects:18,

        leads:160,

        status:"Completed"

    },



    {

        id:3,

        month:"March 2026",

        revenue:"₹5,80,000",

        Clients:52,

        projects:15,

        leads:145,

        status:"Processing"

    },



]);






return(



<div className="report-container">





<div className="report-header">


<div>

<h1>
Reports
</h1>


<p>
Analyze your business performance and growth.
</p>


</div>



<button className="download-report-btn">

Download Report

</button>


</div>






{/* Summary Cards */}


<div className="report-cards">



<div className="report-card">


<h3>
Total Revenue
</h3>


<strong>
₹16.5L
</strong>


</div>





<div className="report-card">


<h3>
Total Clients
</h3>


<strong>
157
</strong>


</div>






<div className="report-card">


<h3>
Completed Projects
</h3>


<strong>
45
</strong>


</div>






<div className="report-card">


<h3>
Generated Leads
</h3>


<strong>
425
</strong>


</div>



</div>







{/* Report Table */}



<div className="report-table-wrapper">



<table className="report-table">


<thead>


<tr>


<th>
Month
</th>


<th>
Revenue
</th>


<th>
Clients
</th>


<th>
Projects
</th>


<th>
Leads
</th>


<th>
Status
</th>


</tr>


</thead>





<tbody>



{

reports.map((report)=>(


<tr key={report.id}>


<td>
{report.month}
</td>


<td>
{report.revenue}
</td>


<td>
{report.Clients}
</td>


<td>
{report.projects}
</td>


<td>
{report.leads}
</td>



<td>

<span

className={`report-status ${report.status.toLowerCase()}`}

>

{report.status}

</span>


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