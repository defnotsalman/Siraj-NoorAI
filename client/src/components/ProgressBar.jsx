function ProgressBar() {
  return (
    <div className="mt-10">

      <p className="mb-2">
        Reading Progress
      </p>

      <div className="w-full h-4 bg-gray-600 rounded-full">

        <div
          className="h-4 rounded-full bg-green-400"
          style={{ width: "35%" }}
        />

      </div>

    </div>
  );
}

export default ProgressBar;