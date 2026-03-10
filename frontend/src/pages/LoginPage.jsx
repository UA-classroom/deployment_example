import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <div className="min-h-screen bg-primary-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-600 shadow-md shadow-primary-600/25 mb-5">
            <span className="text-xl font-bold text-white tracking-tight">UA</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Logga in
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Skolplattformen for yrkeshogskolan
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
