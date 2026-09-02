import org.lwjgl.openal.AL;
import org.lwjgl.openal.ALC;
import org.lwjgl.openal.ALC10;
import static org.lwjgl.openal.ALC10.*;
import static org.lwjgl.system.MemoryUtil.NULL;

public class Main {
    // Graphics Handles
    private long window;

    // Audio Handles
    private long audioDevice;
    private long audioContext;

    public void run() {
        initGraphics(); // GLFW & OpenGL setup
        initAudio();    // OpenAL setup
        
        loop();         // Game/Render Loop

        cleanup();      // Destroys both systems
    }

    private void initGraphics() {
        // [Previous GLFW window creation code goes here...]
    }

    private void initAudio() {
        // 1. Open the default audio device (NULL defaults to the OS standard output)
        audioDevice = alcOpenDevice((ByteBuffer) null);
        if (audioDevice == NULL) {
            throw new IllegalStateException("Failed to open the default OpenAL audio device.");
        }

        // 2. Create the audio capabilities context
        int[] attributes = {0};
        audioContext = alcCreateContext(audioDevice, attributes);
        if (audioContext == NULL) {
            alcCloseDevice(audioDevice);
            throw new IllegalStateException("Failed to create OpenAL context.");
        }

        // 3. Make the context current on this thread
        alcMakeContextCurrent(audioContext);

        // 4. Critical line: Bridge OpenAL capabilities with LWJGL
        AL.createCapabilities(ALC.createCapabilities(audioDevice));
        
        System.out.println("OpenAL initialized successfully!");
    }

    private void loop() {
        // Run your rendering and optional audio update logic loop here
    }

    private void cleanup() {
        // --- 1. Clean up Audio ---
        if (audioContext != NULL) {
            alcMakeContextCurrent(NULL);
            alcDestroyContext(audioContext);
        }
        if (audioDevice != NULL) {
            alcCloseDevice(audioDevice);
        }

        // --- 2. Clean up Graphics ---
        if (window != NULL) {
            org.lwjgl.glfw.GLFW.glfwDestroyWindow(window);
        }
        org.lwjgl.glfw.GLFW.glfwTerminate();
    }
}
