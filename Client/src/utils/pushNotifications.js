// pushNotifications.js
export const registerServiceWorker = async () => {
  try {
    if (!("serviceWorker" in navigator)) {
      console.warn("❌ Service Worker not supported in this browser");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String) => {
  try {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  } catch (error) {
    console.error("❌ Failed to convert VAPID key:", error);
    throw new Error("Invalid VAPID public key format");
  }
};

export const subscribeUserToPush = async () => {
  try {
    console.log("1. Starting push subscription process...");
    
    if (!("serviceWorker" in navigator)) {
      console.warn("❌ Push notifications not supported");
      return null;
    }

    // Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error("❌ Service Worker registration failed");
      return null;
    }
    console.log("2. Service Worker registered successfully");

    // Request permission
    const permission = await Notification.requestPermission();
    console.log("3. Notification permission:", permission);
    
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied by user");
      return null;
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log("4. Found existing subscription");
      console.log("   Endpoint:", subscription.endpoint.substring(0, 50) + "...");
    } else {
      console.log("4. No existing subscription found, creating new one...");
      
      // Validate VAPID key
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VITE_VAPID_PUBLIC_KEY is not defined in environment variables");
      }
      
      console.log("   Using VAPID key:", vapidPublicKey.substring(0, 20) + "...");
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log("5. New subscription created successfully");
      console.log("   Endpoint:", subscription.endpoint.substring(0, 50) + "...");
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.token) {
      console.warn("❌ User not logged in, subscription saved locally only");
      return subscription;
    }

    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    const apiBaseUrl = isLocalhost 
      ? 'http://localhost:4000/api/v1' 
      : 'https://crm.fdbs.in/api/v1';
    
    console.log(`6. Sending subscription to backend (${apiBaseUrl})...`); 
    const response = await fetch(`${apiBaseUrl}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`,
      },
      body: JSON.stringify({ 
        subscription,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }),
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error("❌ Backend subscription save failed:", responseData);
      throw new Error(responseData.message || "Failed to save subscription");
    }
    console.log("7. ✅ Subscription saved to backend successfully!");
    console.log("   User ID:", user.id || user._id);
    console.log("   Response:", responseData);
    return subscription;
  } catch (error) {
    console.error("❌ Push subscription error:", error); 
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error("   Network error - Check backend server is running");
    } else if (error.message.includes('VAPID')) {
      console.error("   VAPID key error - Check environment variables");
    } else if (error.message.includes('permission')) {
      console.error("   Permission error - User may have blocked notifications");
    }
    return null;
  }
}; 
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log("✅ Successfully unsubscribed from push notifications"); 
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.token) {
        const isLocalhost = window.location.hostname === 'localhost';
        const apiBaseUrl = isLocalhost 
          ? 'http://localhost:4000/api/v1' 
          : 'https://crm.fdbs.in/api/v1';
        
        await fetch(`${apiBaseUrl}/push/unsubscribe`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${user.token}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("❌ Failed to unsubscribe:", error);
  }
}; 
export const checkPushSubscriptionStatus = async () => {
  try {
    console.group("🔍 Push Notification Status Check"); 
    console.log("1. Service Worker Support:", "serviceWorker" in navigator);
    console.log("2. Push Manager Support:", "pushManager" in navigator.serviceWorker);
    console.log("3. Notification Support:", "Notification" in window); 
    console.log("4. Notification Permission:", Notification.permission); 
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      console.log("5. Service Worker Ready:", !!registration); 
      const subscription = await registration.pushManager.getSubscription();
      console.log("6. Active Subscription:", !!subscription);
      if (subscription) {
        const subJson = subscription.toJSON();
        console.log("7. Subscription Details:", {
          endpoint: subJson.endpoint.substring(0, 60) + "...",
          expirationTime: subJson.expirationTime,
          keys: Object.keys(subJson.keys || {})
        });
      }
    }
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log("8. VAPID Key Loaded:", !!vapidKey);
    if (vapidKey) {
      console.log("   Key length:", vapidKey.length);
      console.log("   Key preview:", vapidKey.substring(0, 20) + "...");
    }
    console.groupEnd();
  } catch (error) {
    console.error("Status check failed:", error);
  }
};

