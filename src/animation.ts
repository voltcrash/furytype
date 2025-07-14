// Initialize animation when called from main
export function initializeAnimation(): void {
    document.body.offsetHeight;
    startPageAnimation();

    const logoIcon = document.getElementById("themeToggle") as HTMLImageElement;
    let currentRotation = parseInt(logoIcon.getAttribute("data-rotation") || "0");

    if (isNaN(currentRotation) || currentRotation === 0) {
        currentRotation = 405;
        logoIcon.style.transform = `rotate(${currentRotation}deg)`;
        logoIcon.setAttribute("data-rotation", currentRotation.toString());
    }
}

// Page Animation
function startPageAnimation(): void {
    const body = document.querySelector("body") as HTMLBodyElement;
    const logoIcon = document.getElementById("themeToggle") as HTMLImageElement;
    const mainContent = document.querySelector("main") as HTMLElement;
    const header = document.querySelector("header") as HTMLElement;
    body.style.opacity = "0";

    setTimeout(() => {
        body.style.transition = "transform 0.2s ease-in-out, opacity 0.2s ease-in-out";
        body.style.opacity = "1";
    }, 100);

    setTimeout(() => {
        logoIcon.style.transition = "transform 1s ease-out";
        logoIcon.style.transform = `rotate(495deg)`;
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

    let currentRotation = parseInt(logoIcon.getAttribute('data-rotation') || '0');
    currentRotation += 360;

    const darkIcon = "src/assets/images/dark_icon.png";
    const lightIcon = "src/assets/images/light_icon.png";

    logoIcon.style.transition = "transform 0.3s ease-in-out";
    logoIcon.style.transform = `rotate(${currentRotation}deg)`;
    logoIcon.setAttribute('data-rotation', currentRotation.toString());

    let newTheme: string;
    if (bodyElement.classList.contains("body2")) {
        bodyElement.classList.remove("body2");
        bodyElement.classList.add("body");
        logoIcon.src = darkIcon;

        linkElements.forEach((link: HTMLAnchorElement) => {
            link.classList.add("dark-mode-link");
            link.classList.remove("light-mode-link");
        });

        newTheme = 'dark';
    } else {
        bodyElement.classList.remove("body");
        bodyElement.classList.add("body2");
        logoIcon.src = lightIcon;

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