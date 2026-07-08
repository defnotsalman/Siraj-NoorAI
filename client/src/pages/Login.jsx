import LoginForm from "../components/Auth/LoginForm";

function Login() {
  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-4xl font-bold text-white text-center mb-8">
        🔐 Login
      </h1>

      <LoginForm />
    </div>
  );
}

export default Login;