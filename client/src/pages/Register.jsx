import RegisterForm from "../components/Auth/RegisterForm";

function Register() {
  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-4xl font-bold text-white text-center mb-8">
        🌙 Create Account
      </h1>

      <RegisterForm />
    </div>
  );
}

export default Register;