document.querySelector(".updateBtn").addEventListener("click", (e) => {
  console.log("updating...");
  let _id = e.target.getAttribute("id");
  let fullName = document.getElementById("fullName").value;
  let email = document.getElementById("fullName").value;
  let phone = document.getElementById("phone").value;
  let website = document.getElementById("website").value;
  let twitter = document.getElementById("twitter").value;
  let facebook = document.getElementById("facebook").value;
  let instagram = document.getElementById("ig").value;
  let updatedAt = new Date().toLocaleTimeString();

  const settings = {
    fullName,
    email,
    phone,
    website,
    twitter,
    facebook,
    instagram,
  };

  fetch("/updateProfile", {
    method: "put",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      _id,
      settings,
      updatedAt,
    }),
  })
    .then((response) => {
      if (response.ok) return response.json();
    })
    .then((data) => {
      console.log(data);
      window.location.reload(true);
    });
});
