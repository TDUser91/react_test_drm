import React from 'react';
import VideoPlayerShaka from './VideoPlayerShaka';


// URL: https://storage.googleapis.com/shaka-demo-assets/angel-one-widevine/dash.mpd
// SERVER_LICENSE: https://cwip-shaka-proxy.appspot.com/no_auth

function App() {
  return (
    <>
      <VideoPlayerShaka />
    </>
  );
}

export default App;
