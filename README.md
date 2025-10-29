**Inspiration**
We spent the last week struggling to study for our CSC207 midterm, a course where lectures are structured entirely around program files. Without slideshows or organization of key terms, we spent too much time gathering and organizing the lecture content when we should have been reviewing and practicing. That's why we developed Claricode.

**What it does**
Claricode is an AI-powered application designed for computer science students. It takes code and image files and transforms them into structured and editable lessons that break key terms and concepts into definitions, code examples, visual examples, and potentially important information and edge cases. The application features an integrated chatbot to support learning, and users can even take notes straight on the lesson. In addition, Claricode ensure true accessibility. With various regular and accessibility themes, text-to-speech options, and the ability to convert lessons into downloadable PDF files for easy access anywhere, Claricode is the perfect tool for all computer science students.

**How we built it**
We built Claircode with the following tech stack:
- Frontend Framework: React (with react-dom for rendering)
- Language: TypeScript
- Build Tool/Bundler: Vite
- Styling: Tailwind CSS
- AI Integration: Google Gemini API (via the @google/genai SDK) for lesson generation, visual diagrams, - text-to-speech, and the interactive chatbot
- PDF Generation: jsPDF for exporting lessons
- Data Persistence: Browser's localStorage for saving user folders, lessons, display settings, and theme preferences
- Browser APIs: FileReader for file uploads and AudioContext for audio playback of generated speech

**Challenges we ran into**
One of our biggest challenges was incorporating our accessibility and theming. Implementing multiple distinct themes (light, dark, system, accessibility, dark-high-contrast) was a struggle: not only to implement but also to anticipate what the true requirements of an accessibility user would be. Additionally, prompt engineering for visuals required crafting precise, detailed prompts for accurate 2D schematic diagrams, which took a lot to narrow down. Integrations were a struggle as well, especially given that we were novices to the world of vibecoding. Through these 24 hours, we realized that AI-programming tools truly have a strong potential to advance the future of development; however, we must recognize the struggles taken on to work backwards to build dependability as well as aesthetics.

**Accomplishments that we're proud of**
As students ourselves, we were very understanding of the fact that users of our webapp would need to be engaged and motivated through their entire interaction (let's face it, looking at long code files for hours tends to blur students' study motivation). To help with these concerns, we made it a strong point to focus on user engagement, accessibility, and aesthetic design. These were all implemented in the hopes of allowing a wide range of users not only to use our webapp, but to feel like they are getting an effective study period out of it. Additionally, we are very proud of the interactive AI tutor, which allows students to further their understanding of complex concepts. The prompt engineering for this feature took a lot of refinement as we wanted the chatbot to actually facilitate students' learning, not just spam them with information.

**What we learned**
We learned how to create a full frontend framework with React and use styling, and build tools like Vite and Tailwind CSS. We also learned a lot about how to incorporate accessible design into web applications, like the importance of high-contrast theme options.

**What's next for Claricode**
We hope to see Claricode used by computer-science students worldwide, in an effort to broaden the scope of technological education for all. As for concrete steps, we believe that Claricode can benefit from several features, including but not limited to:
- User authentication
- Integration of educational platforms (such as Quercus) that allow for instructor-to-student communication and teaching through Claricode
- Text-to-speech advanced to translations to broaden user reach
- Branching out to more practical disciplines outside of computer science (such as turning a live chemistry experiment into a structured lesson)

**Try it out**
claricode-91186695923.us-west1.run.app
