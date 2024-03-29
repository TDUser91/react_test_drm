import React, { useState, useRef, useEffect } from "react";
import shaka from 'shaka-player/dist/shaka-player.ui';

const VideoPlayerShaka = (props: any) => {
    const {
        fairplayLicenseURI = "",
        fairplayCertificateURI = "",
        widevineLicenseURI = "",
        src = "",
        onPlayerError,
        onPlaybackError,
        ...configs
    } = props;

    const controllerRef = useRef(null);
    const [assetLoaded, setAssetLoaded] = useState(false);

    const onInternalPlayerError = (event: any) => {
        if (onPlayerError) {
            onPlayerError(event);
        }
    }

    const onInternalPlaybackError = (error: any) => {
        if (onPlaybackError) {
            onPlaybackError(error);
        }
    }

    async function loadAssetWithWidevine() {
        let video = controllerRef.current;

        let player = new shaka.Player(video);

        player.addEventListener('error', onInternalPlayerError);

        player.configure({
            drm: {
                servers: {
                    'com.widevine.alpha': widevineLicenseURI
                },
                advanced: {
                    'com.widevine.alpha': {
                        'videoRobustness': 'SW_SECURE_CRYPTO',
                        'audioRobustness': 'SW_SECURE_CRYPTO'
                    }
                }
            }
        });

        player.load(src).then(function () {
            setAssetLoaded(true);
        }).catch(onInternalPlaybackError);
    }

    async function loadAssetWithFairplay() {
        const req = await fetch(fairplayCertificateURI);
        const cert = await req.arrayBuffer();

        let video = controllerRef.current;

        let player = new shaka.Player(video);

        player.getNetworkingEngine()!.registerRequestFilter((type: any, request: any) => {
            if (type !== shaka.net.NetworkingEngine.RequestType.LICENSE) {
                return;
            }
            const originalPayload = new Uint8Array(request.body);
            let spc_string = btoa(String.fromCharCode(...new Uint8Array(request.body)));
            request.headers['Content-Type'] = 'application/json';
            request.body = JSON.stringify({
                "spc": spc_string
            });
        });

        player.getNetworkingEngine()!.registerResponseFilter((type: any, response: any) => {
            if (type !== shaka.net.NetworkingEngine.RequestType.LICENSE) {
                return;
            }

            let responseText = shaka.util.StringUtils.fromUTF8(response.data);
            const parsedResponse = JSON.parse(responseText);
            response.data = shaka.util.Uint8ArrayUtils.fromBase64(parsedResponse.ckc).buffer;
        });

        player.addEventListener('error', onInternalPlayerError);

        player.configure({
            drm: {
                servers: {
                    'com.apple.fps': fairplayLicenseURI,
                },
                advanced: {
                    'com.apple.fps': {
                        serverCertificate: new Uint8Array(cert)
                    }
                }
            }
        });

        player.load(src).then(function () {
            setAssetLoaded(true);
        }).catch(onInternalPlaybackError);
    }

    async function loadAssetWithoutDRM() {
        let video = controllerRef.current;

        let player = new shaka.Player(video);

        player.addEventListener('error', onInternalPlayerError);

        player.load(src).then(function () {
            setAssetLoaded(true);
        }).catch(onInternalPlaybackError);
    }

    useEffect(() => {

        // if (controllerRef.current != null && assetLoaded != null) {
        //     if (!controllerRef.current.canPlayType('application/vnd.apple.mpegurl') && !assetLoaded && widevineLicenseURI) {
        //         loadAssetWithWidevine();
        //     } else if (controllerRef.current.canPlayType('application/vnd.apple.mpegurl') && !assetLoaded && fairplayCertificateURI && fairplayLicenseURI) {
        //         loadAssetWithFairplay();
        //     } else if (!assetLoaded) {
        //         loadAssetWithoutDRM();
        //     }

        // }

        //! TODO: to be tested 
        if (controllerRef.current !== null && assetLoaded !== null) {
            if (!assetLoaded && widevineLicenseURI) {
                loadAssetWithWidevine();
            } else if (!assetLoaded && fairplayCertificateURI && fairplayLicenseURI) {
                loadAssetWithFairplay();
            } else if (!assetLoaded) {
                loadAssetWithoutDRM();
            }

        }

    }, [assetLoaded]);


    return (
        <video
            ref={controllerRef}
            {...configs}>

        </video>
    );
}

export default VideoPlayerShaka;