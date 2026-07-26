/**
 * three-bg.js - Three.js background animation
 * Creates animated 3D background with skewers and ingredients
 */

// Initialize Three.js background
function initThreeJSBackground() {
  // Check if THREE is available globally
  if (typeof THREE === 'undefined') {
    console.error('THREE.js is not loaded. Make sure it is included in your HTML');
    return;
  }

  const canvas = document.getElementById("bg-canvas");
  if (!canvas) {
    console.error("Background canvas element not found");
    return; // Exit if canvas doesn't exist
  }

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xf9b60f, 2);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Create sate skewers
    const skewers = [];
    const sateColors = [
      0xf9b60f, // Primary color
      0xe67e22, // Accent color
      0x3d7d4c, // Secondary color
    ];

    // Function to create skewer objects
    function createSkewer(color, x, y, z) {
      // Create the stick
      const stickGeometry = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
      const stickMaterial = new THREE.MeshStandardMaterial({
        color: 0xddaa77,
      });
      const stick = new THREE.Mesh(stickGeometry, stickMaterial);
      stick.rotation.x = Math.PI / 2;

      // Create the meat pieces
      const group = new THREE.Group();
      group.add(stick);

      const meatCount = 3 + Math.floor(Math.random() * 3); // 3-5 pieces

      for (let i = 0; i < meatCount; i++) {
        const meatGeometry = new THREE.BoxGeometry(1, 0.8, 0.5);
        const meatMaterial = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.7,
          metalness: 0.1,
        });
        const meat = new THREE.Mesh(meatGeometry, meatMaterial);

        // Position along the stick
        const position = (i - (meatCount - 1) / 2) * 1.2;
        meat.position.y = position;

        // Slight rotation for natural look
        meat.rotation.x = Math.random() * 0.4 - 0.2;
        meat.rotation.z = Math.random() * 0.4 - 0.2;

        group.add(meat);
      }

      group.position.set(x, y, z);
      scene.add(group);

      return group;
    }

    // Function to create ingredient objects
    const ingredients = [];

    function createIngredient(type, x, y, z) {
      let geometry, material, mesh;

      switch (type) {
        case "onion":
          geometry = new THREE.SphereGeometry(0.5, 12, 12);
          material = new THREE.MeshStandardMaterial({ color: 0xa020f0 });
          break;
        case "chili":
          geometry = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
          material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
          break;
        case "lime":
          geometry = new THREE.SphereGeometry(0.4, 16, 16);
          material = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
          break;
        case "peanut":
          geometry = new THREE.SphereGeometry(0.3, 8, 8);
          material = new THREE.MeshStandardMaterial({ color: 0xcd853f });
          break;
        default:
          geometry = new THREE.SphereGeometry(0.3, 8, 8);
          material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      }

      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);

      // Slight rotation for natural look
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;

      scene.add(mesh);

      return mesh;
    }

    // Create multiple skewers (reduce number for better performance)
    for (let i = 0; i < 8; i++) {
      const color = sateColors[Math.floor(Math.random() * sateColors.length)];
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20 - 10; // Behind the camera

      const skewer = createSkewer(color, x, y, z);
      skewer.rotation.z = Math.random() * Math.PI;
      skewer.rotation.y = Math.random() * Math.PI;

      skewers.push({
        obj: skewer,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        floatSpeed: 0.005 + Math.random() * 0.01,
        floatOffset: Math.random() * Math.PI * 2,
        floatDistance: 0.2 + Math.random() * 0.3,
      });
    }

    // Create multiple ingredients (for menu page only)
    const currentPath = window.location.pathname;
    if (currentPath === '/' || 
        currentPath.includes('index.html') || 
        currentPath.endsWith('/')) {
      const ingredientTypes = ["onion", "chili", "lime", "peanut"];
      // Reduce number for better performance
      for (let i = 0; i < 10; i++) {
        const type = ingredientTypes[Math.floor(Math.random() * ingredientTypes.length)];
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 20 - 10;

        const ingredient = createIngredient(type, x, y, z);

        ingredients.push({
          obj: ingredient,
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01,
          },
          floatSpeed: 0.005 + Math.random() * 0.01,
          floatOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    // Animation
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Animate skewers
      skewers.forEach((skewer) => {
        skewer.obj.rotation.z += skewer.rotationSpeed;
        skewer.obj.position.y +=
          Math.sin(elapsedTime * skewer.floatSpeed + skewer.floatOffset) *
          0.01;
        skewer.obj.position.x +=
          Math.cos(elapsedTime * skewer.floatSpeed + skewer.floatOffset) *
          0.01;
      });

      // Animate ingredients
      ingredients.forEach((ingredient) => {
        ingredient.obj.rotation.x += ingredient.rotationSpeed.x;
        ingredient.obj.rotation.y += ingredient.rotationSpeed.y;
        ingredient.obj.rotation.z += ingredient.rotationSpeed.z;

        ingredient.obj.position.y +=
          Math.sin(
            elapsedTime * ingredient.floatSpeed + ingredient.floatOffset
          ) * 0.01;
        ingredient.obj.position.x +=
          Math.cos(
            elapsedTime * ingredient.floatSpeed + ingredient.floatOffset
          ) * 0.01;
      });

      renderer.render(scene, camera);
    }

    // Handle window resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", handleResize);
    
    // Start animation
    animate();
    
    console.log("Three.js background initialized successfully");
  } catch (error) {
    console.error("Error setting up Three.js scene:", error);
  }
}

// Create 3D skewer icon for empty cart
function createSkewer3DIcon() {
  const container = document.createElement("div");
  container.className = "skewer-icon";

  const innerScene = document.createElement("div");
  innerScene.className = "skewer-inner";
  innerScene.innerHTML = `
    <i class="fas fa-utensils" style="font-size: 3rem; color: var(--primary);"></i>
  `;

  container.appendChild(innerScene);
  return container;
}

export { initThreeJSBackground, createSkewer3DIcon };