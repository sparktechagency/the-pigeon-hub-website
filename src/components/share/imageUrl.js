export const getImageUrl = (path) => {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  } else {
    const baseUrl = "https://ftp.thepigeonhub.com";
    // const baseUrl = "http://50.6.200.33:5001";
    // const baseUrl = "http://10.10.7.41:5001";
    return `${baseUrl}/${path}`;
  }
};

