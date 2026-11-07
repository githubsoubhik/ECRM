"use client";


import {
ChangeEvent,
FormEvent,
useState
} from "react";

import Link from "next/link";

import {useRouter} from "next/navigation";

import toast from "react-hot-toast";


export default function SignupForm(){


const router = useRouter();



const [formData,setFormData]=useState({

name:"",
email:"",
password:"",
confirmPassword:""

});



const handleChange=(
e:ChangeEvent<HTMLInputElement>
)=>{


setFormData({

...formData,

[e.target.name]:e.target.value

});


}



const handleSubmit=(
e:FormEvent<HTMLFormElement>
)=>{


e.preventDefault();


// Signup API will come here later


toast.success(
"Account created successfully!"
);



setTimeout(()=>{


router.push("/login");


},2000);



}



return(

<>

<h2 className="form-title">
        Employee <span>SignUp</span>
      </h2>
      <p className="form-subtitle">
        Create to Access your workspace and stay connected with your team.
      </p>

<form
onSubmit={handleSubmit}
className="auth-form"
>


<input

name="name"

placeholder="Full Name"

className="auth-input"

onChange={handleChange}

/>


<input

name="email"

type="email"

placeholder="Email Address"

className="auth-input"

onChange={handleChange}

/>



<input

name="password"

type="password"

placeholder="Password"

className="auth-input"

onChange={handleChange}

/>



<input

name="confirmPassword"

type="password"

placeholder="Confirm Password"

className="auth-input"

onChange={handleChange}

/>



<button

type="submit"

className="auth-button"

>

Create Account

</button>



<p className="auth-switch">

Already have an account?

<Link 
href="/login"
className="auth-link"
>
Login
</Link>

</p>


</form>
</>

)


}