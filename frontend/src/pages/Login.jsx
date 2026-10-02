import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import PulseLogo from "../components/PulseLogo";


function Login() {

    const navigate = useNavigate();


    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });


    const [error, setError] = useState("");


    // ========================================================
    // HANDLE INPUT
    // ========================================================

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]:
                e.target.value

        });

    };


    // ========================================================
    // LOGIN
    // ========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        try {

            const response =
                await api.post(
                    "/auth/login",
                    formData
                );


            localStorage.setItem(
                "token",
                response.data.token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(
                    response.data.user
                )
            );


            navigate("/chat");


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Invalid email or password"
            );

        }

    };


    return (

        <div className="
            min-h-screen
            bg-slate-950
            flex
            items-center
            justify-center
            px-4
            relative
            overflow-hidden
        ">


            {/* =================================================
                BACKGROUND GLOW
            ================================================= */}

            <div className="
                absolute
                -top-40
                -left-40
                w-96
                h-96
                bg-blue-600/20
                rounded-full
                blur-3xl
            " />

            <div className="
                absolute
                -bottom-40
                -right-40
                w-96
                h-96
                bg-purple-600/20
                rounded-full
                blur-3xl
            " />


            {/* =================================================
                LOGIN CARD
            ================================================= */}

            <div className="
                relative
                w-full
                max-w-md
                bg-white/10
                backdrop-blur-xl
                border
                border-white/10
                rounded-3xl
                shadow-2xl
                p-8
                sm:p-10
            ">


                {/* =================================================
                    LOGO
                ================================================= */}

                {/* =================================================
                    PULSECHAT LOGO & BRANDING
                ================================================= */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative mb-3 group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition duration-700 animate-pulse" />
                        <div className="relative p-2 rounded-2xl bg-slate-900/90 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center justify-center">
                            <PulseLogo size={52} animated={true} />
                        </div>
                    </div>
                    <span className="text-xs uppercase tracking-widest font-extrabold bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
                        PulseChat Messenger
                    </span>
                </div>

                {/* =================================================
                    HEADING
                ================================================= */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-slate-400 text-xs sm:text-sm">
                        Experience next-gen real-time messaging
                    </p>
                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="
                        mb-5
                        rounded-xl
                        border
                        border-red-500/20
                        bg-red-500/10
                        px-4
                        py-3
                        text-sm
                        text-red-300
                    ">

                        {error}

                    </div>

                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >


                    {/* EMAIL */}

                    <div>

                        <label className="
                            block
                            mb-2
                            text-sm
                            font-medium
                            text-slate-300
                        ">
                            Email address
                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="
                                w-full
                                rounded-xl
                                border
                                border-white/10
                                bg-slate-900/70
                                px-4
                                py-3
                                text-white
                                placeholder-slate-500
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-500/20
                            "
                        />

                    </div>


                    {/* PASSWORD */}

                    <div>

                        <label className="
                            block
                            mb-2
                            text-sm
                            font-medium
                            text-slate-300
                        ">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="
                                w-full
                                rounded-xl
                                border
                                border-white/10
                                bg-slate-900/70
                                px-4
                                py-3
                                text-white
                                placeholder-slate-500
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-500/20
                            "
                        />

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="
                            w-full
                            rounded-xl
                            bg-gradient-to-r
                            from-blue-500
                            to-purple-600
                            py-3
                            font-semibold
                            text-white
                            shadow-lg
                            shadow-blue-500/20
                            transition
                            hover:scale-[1.01]
                            hover:shadow-blue-500/30
                            active:scale-[0.99]
                        "
                    >
                        Sign in
                    </button>

                </form>


                {/* =================================================
                    REGISTER
                ================================================= */}

                <div className="
                    mt-7
                    text-center
                    text-sm
                    text-slate-400
                ">

                    Don't have an account?

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register")
                        }
                        className="
                            ml-1
                            font-semibold
                            text-blue-400
                            hover:text-blue-300
                            transition
                        "
                    >
                        Create account
                    </button>

                </div>

            </div>

        </div>

    );

}


export default Login;