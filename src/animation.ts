// Initialize animation when called from main
export function initializeAnimation(): void {
    document.body.offsetHeight;
    startPageAnimation();

    const logoIcon = document.getElementById("themeToggle") as HTMLImageElement;
    
    // Start the logo at 0 degrees - no jarring initial rotation
    logoIcon.style.transform = `rotate(0deg)`;
    logoIcon.setAttribute("data-rotation", "0");
}

// Page Animation
function startPageAnimation(): void {
    const body = document.querySelector("body") as HTMLBodyElement;
    const logoIcon = document.getElementById("themeToggle") as HTMLImageElement;
    const mainContent = document.querySelector("main") as HTMLElement;
    const header = document.querySelector("header") as HTMLElement;
    const kbd = document.querySelector("kbd") as HTMLElement;
    body.style.opacity = "0";

    setTimeout(() => {
        body.style.transition = "transform 0.2s ease-in-out, opacity 0.2s ease-in-out";
        body.style.opacity = "1";
    }, 100);

    setTimeout(() => {
        logoIcon.style.transition = "transform 1s ease-out";
        logoIcon.style.transform = `rotate(360deg)`;
        // Reset to 0 degrees after animation completes
        setTimeout(() => {
            logoIcon.style.transition = "none";
            logoIcon.style.transform = `rotate(0deg)`;
            logoIcon.setAttribute("data-rotation", "0");
        }, 1000);
    }, 300);

    header.style.opacity = "0";
    header.style.transform = "translateY(-50px)";

    setTimeout(() => {
        header.style.transition = "opacity 1s ease-in-out, transform 1s ease-in-out";

        header.style.opacity = "1";
        header.style.transform = "translateY(0)";
    }, 600);

    mainContent.style.opacity = "0";
    setTimeout(() => {
        mainContent.style.transition = "opacity 1s ease-in-out";
        mainContent.style.opacity = "1";
    }, 1000);
}

// Theme Toggle - exported for global use
export function toggle_mode(): void {
    const bodyElement = document.getElementsByTagName("body")[0] as HTMLBodyElement;
    const logoIcon = document.getElementById("themeToggle") as HTMLImageElement;
    const linkElements = document.querySelectorAll("a") as NodeListOf<HTMLAnchorElement>;
    const githubLogo = document.getElementById("githubLogo") as HTMLImageElement;
    
    // Always rotate 360 degrees from current position
    let currentRotation = parseInt(logoIcon.getAttribute('data-rotation') || '0');
    let targetRotation = currentRotation + 360;

    const darkGit = "/images/github.svg";
    const lightGit = "/images/github-light.svg";

    logoIcon.style.transition = "transform 0.3s ease-in-out";
    logoIcon.style.transform = `rotate(${targetRotation}deg)`;

    // Reset to 0 degrees after animation completes
    setTimeout(() => {
        logoIcon.style.transition = "none";
        logoIcon.style.transform = `rotate(0deg)`;
        logoIcon.setAttribute('data-rotation', '0');
    }, 300);

    let newTheme: string;
    if (bodyElement.classList.contains("body2")) {
        bodyElement.classList.remove("body2");
        bodyElement.classList.add("body");
        githubLogo.src = darkGit;

        linkElements.forEach((link: HTMLAnchorElement) => {
            link.classList.add("dark-mode-link");
            link.classList.remove("light-mode-link");
        });

        newTheme = 'dark';
    } else {
        bodyElement.classList.remove("body");
        bodyElement.classList.add("body2");
        githubLogo.src = lightGit;

        linkElements.forEach((link: HTMLAnchorElement) => {
            link.classList.add("light-mode-link");
            link.classList.remove("dark-mode-link");
        });

        newTheme = 'light';
    }

    // Update the theme in typing module and redraw keyboard
    if (typeof (window as any).updateTheme === 'function') {
        (window as any).updateTheme(newTheme);
    }
}

// Navigation Bar Control - exported for use during typing
export function hideNavbar(): void {
    const navbar = document.querySelector(".nav_bar") as HTMLElement;
    if (navbar) {
        navbar.classList.remove("visible");
        navbar.classList.add("hidden");
    }
}

export function showNavbar(): void {
    const navbar = document.querySelector(".nav_bar") as HTMLElement;
    if (navbar) {
        navbar.classList.remove("hidden");
        navbar.classList.add("visible");
    }
}

export function hideFooter(): void {
    const footer = document.querySelector(".footer") as HTMLElement;
    if (footer) {
        footer.classList.remove("visible");
        footer.classList.add("hidden");
    }
}

export function showFooter(): void {
    const footer = document.querySelector(".footer") as HTMLElement;
    if (footer) {
        footer.classList.remove("hidden");
        footer.classList.add("visible");
    }
}