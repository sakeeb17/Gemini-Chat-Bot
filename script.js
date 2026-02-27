const generateAPIResponse = async (incomingMessageDiv, retryCount = 3) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();

        // 🔥 Handle 429 Rate Limit
        if (response.status === 429) {
            if (retryCount > 0) {
                await new Promise(res => setTimeout(res, 2000)); // wait 2 sec
                return generateAPIResponse(incomingMessageDiv, retryCount - 1);
            }
            throw new Error("Too many requests. Please wait a few seconds.");
        }

        if (!response.ok) {
            throw new Error(data.error?.message || "Something went wrong");
        }

        const apiResponse =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/\*\*(.*?)\*\*/g, '$1') 
            || "No response received.";

        showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};
