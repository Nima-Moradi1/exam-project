export type SeedQuestion = {
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "DROPDOWN" | "SHORT_TEXT";
  prompt: string;
  options?: string[];
  answer: string | string[] | boolean;
  explanation: string;
  topic: string;
};

export type SeedExam = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  instructions: string;
  categoryKey: string;
  difficulty: "BEGINNER" | "ELEMENTARY" | "INTERMEDIATE" | "UPPER_INTERMEDIATE" | "ADVANCED" | "EXPERT";
  durationSeconds: number;
  outline: string[];
  questions: SeedQuestion[];
};

const readingQuestions: SeedQuestion[] = [
  { type: "SINGLE_CHOICE", prompt: "What is the main purpose of a public library in the passage?", options: ["To sell books", "To provide community access to information", "To replace schools", "To store private records"], answer: "To provide community access to information", explanation: "The passage presents the library as a shared place for learning and access.", topic: "ielts-reading" },
  { type: "TRUE_FALSE", prompt: "The passage says that every library visitor must borrow a printed book.", answer: false, explanation: "Visitors can use digital resources and study spaces without borrowing a book.", topic: "ielts-reading" },
  { type: "DROPDOWN", prompt: "Choose the word that best completes the sentence: The new service was designed to ___ access for rural learners.", options: ["reduce", "expand", "ignore", "delay"], answer: "expand", explanation: "Expand means increase availability or reach.", topic: "ielts-vocabulary" },
  { type: "SHORT_TEXT", prompt: "Write the two-word phrase used for a quiet place to study: ____ room", answer: "study room", explanation: "The passage refers to a study room for quiet work.", topic: "ielts-reading" },
  { type: "SINGLE_CHOICE", prompt: "Why did the library introduce evening workshops?", options: ["Staff preferred night shifts", "Many adults were unavailable during the day", "The building was empty", "Children requested them"], answer: "Many adults were unavailable during the day", explanation: "The workshops respond to adult learners' schedules.", topic: "ielts-reading" },
  { type: "TRUE_FALSE", prompt: "Online catalogues can help users locate materials before visiting the library.", answer: true, explanation: "A searchable catalogue lets visitors find material in advance.", topic: "ielts-reading" },
  { type: "DROPDOWN", prompt: "Choose the connector: The class was full; ___, a second session was added.", options: ["however", "therefore", "although", "unless"], answer: "therefore", explanation: "Therefore introduces a result.", topic: "ielts-grammar" },
  { type: "SHORT_TEXT", prompt: "What kind of membership is described as free?", answer: "library membership", explanation: "The passage explicitly says library membership is free.", topic: "ielts-reading" },
  { type: "SINGLE_CHOICE", prompt: "Which feature supports visitors with visual impairments?", options: ["A café", "Screen-reader compatible computers", "A larger car park", "Printed posters"], answer: "Screen-reader compatible computers", explanation: "Screen readers make digital content accessible.", topic: "ielts-accessibility" },
  { type: "TRUE_FALSE", prompt: "The passage recommends using only one source when researching a topic.", answer: false, explanation: "It encourages comparing reliable sources.", topic: "ielts-reading" }
];

const typescriptQuestions: SeedQuestion[] = [
  { type: "SINGLE_CHOICE", prompt: "Which annotation describes a value that can be a string or a number?", options: ["string & number", "string | number", "string[]", "unknown[]"], answer: "string | number", explanation: "A union uses the | operator.", topic: "typescript-unions" },
  { type: "TRUE_FALSE", prompt: "TypeScript types are removed when JavaScript is emitted.", answer: true, explanation: "Types are compile-time constructs and are erased from output.", topic: "typescript-basics" },
  { type: "SINGLE_CHOICE", prompt: "Which check narrows an unknown value to a string?", options: ["value instanceof String", "typeof value === 'string'", "value === String", "value as string"], answer: "typeof value === 'string'", explanation: "typeof is a runtime type guard for primitive strings.", topic: "typescript-narrowing" },
  { type: "SHORT_TEXT", prompt: "Write the keyword used to declare a generic type parameter in `function identity<T>(value: T)`. ", answer: "T", explanation: "T is a conventional generic type parameter name.", topic: "typescript-generics" },
  { type: "SINGLE_CHOICE", prompt: "What does an optional property use after its name?", options: ["!", "?", "*", "|"], answer: "?", explanation: "The question mark marks a property as optional.", topic: "typescript-interfaces" },
  { type: "TRUE_FALSE", prompt: "An interface can describe the shape of an object.", answer: true, explanation: "Interfaces define object contracts.", topic: "typescript-interfaces" },
  { type: "SINGLE_CHOICE", prompt: "Which type is safer than `any` for an unvalidated API response?", options: ["never", "unknown", "void", "null"], answer: "unknown", explanation: "Unknown requires narrowing before use.", topic: "typescript-basics" },
  { type: "DROPDOWN", prompt: "Choose the utility type that makes every property optional.", options: ["Pick", "Partial", "Record", "Readonly"], answer: "Partial", explanation: "Partial<T> makes all properties optional.", topic: "typescript-utilities" },
  { type: "SINGLE_CHOICE", prompt: "What is the result of `keyof User`?", options: ["A runtime array", "A union of property names", "A copy of User", "A boolean"], answer: "A union of property names", explanation: "keyof produces a union of keys at type level.", topic: "typescript-interfaces" },
  { type: "TRUE_FALSE", prompt: "A type assertion performs runtime validation.", answer: false, explanation: "Assertions only affect the type checker.", topic: "typescript-basics" },
  { type: "SINGLE_CHOICE", prompt: "Which syntax creates a readonly array of strings?", options: ["readonly string[]", "const string[]", "fixed string[]", "immutable string[]"], answer: "readonly string[]", explanation: "readonly prevents mutation through that reference.", topic: "typescript-arrays" },
  { type: "SHORT_TEXT", prompt: "What keyword defines a type alias?", answer: "type", explanation: "The `type` keyword introduces an alias.", topic: "typescript-basics" }
];

const reactQuestions: SeedQuestion[] = [
  { type: "SINGLE_CHOICE", prompt: "What should a React component return?", options: ["A database query", "React elements or null", "A CSS file", "A Promise only"], answer: "React elements or null", explanation: "Components render React elements or null.", topic: "react-components" },
  { type: "TRUE_FALSE", prompt: "Props should be treated as immutable by a component.", answer: true, explanation: "A component must not mutate its props.", topic: "react-props" },
  { type: "SINGLE_CHOICE", prompt: "Which hook stores local component state?", options: ["useState", "useEffect", "useMemo", "useId"], answer: "useState", explanation: "useState declares a state variable.", topic: "react-state" },
  { type: "SINGLE_CHOICE", prompt: "Why should items in a list have stable keys?", options: ["For CSS styling", "To help React identify changed items", "To make arrays faster", "To hide IDs"], answer: "To help React identify changed items", explanation: "Keys preserve identity across renders.", topic: "react-keys" },
  { type: "TRUE_FALSE", prompt: "Effects are appropriate for synchronizing with external systems.", answer: true, explanation: "Effects connect React to external systems such as subscriptions.", topic: "react-effects" },
  { type: "DROPDOWN", prompt: "Choose the attribute that connects a label to an input in JSX.", options: ["for", "htmlFor", "labelFor", "inputFor"], answer: "htmlFor", explanation: "JSX uses htmlFor for the HTML for attribute.", topic: "react-accessibility" },
  { type: "SHORT_TEXT", prompt: "Write the hook used to run an effect after rendering.", answer: "useEffect", explanation: "useEffect schedules an effect after a commit.", topic: "react-effects" },
  { type: "SINGLE_CHOICE", prompt: "What causes a component to re-render?", options: ["State or props changing", "A CSS selector", "Opening DevTools", "Adding a comment"], answer: "State or props changing", explanation: "State and prop changes schedule a render.", topic: "react-rendering" },
  { type: "TRUE_FALSE", prompt: "Buttons with icon-only content need an accessible name.", answer: true, explanation: "aria-label or visible text gives assistive technology a name.", topic: "react-accessibility" },
  { type: "SINGLE_CHOICE", prompt: "Which pattern lifts shared state to a common parent?", options: ["Composition", "Lifting state up", "Memoization", "Code splitting"], answer: "Lifting state up", explanation: "The common parent becomes the source of truth.", topic: "react-state" },
  { type: "DROPDOWN", prompt: "Choose the prop that children receive for nested JSX.", options: ["content", "children", "slot", "body"], answer: "children", explanation: "Nested JSX is exposed through the children prop.", topic: "react-components" },
  { type: "TRUE_FALSE", prompt: "Using semantic HTML can improve React application accessibility.", answer: true, explanation: "Semantic elements communicate structure to assistive technology.", topic: "react-accessibility" }
];

export const sampleExams: SeedExam[] = [
  { slug: "ielts-b2-reading-demo", title: "IELTS B2 Reading Demo", shortDescription: "A focused English reading practice test with vocabulary and grammar checks.", description: "Two short reading-style contexts assess comprehension, vocabulary, and careful evidence reading.", instructions: "Read each item carefully. Choose the best answer from the passage context.", categoryKey: "root:ielts:b2:reading", difficulty: "UPPER_INTERMEDIATE", durationSeconds: 30 * 60, outline: ["Community services passage", "Vocabulary in context", "Evidence and inference"], questions: readingQuestions },
  { slug: "ielts-a2-full-demo", title: "IELTS A2 Full Exam Demo", shortDescription: "A compact four-skill English practice exam.", description: "A project-sized A2 demo with accessible, deterministically graded language questions.", instructions: "Complete all short sections. This demo represents listening, reading, writing, and speaking preparation.", categoryKey: "root:ielts:a2:full", difficulty: "ELEMENTARY", durationSeconds: 25 * 60, outline: ["Reading", "Listening vocabulary", "Everyday writing", "Speaking language"], questions: readingQuestions.slice(0, 8) },
  { slug: "typescript-foundations", title: "TypeScript Foundations", shortDescription: "Types, unions, narrowing, generics, and interfaces.", description: "A practical foundations exam for developers beginning TypeScript.", instructions: "Choose the most accurate TypeScript answer for each scenario.", categoryKey: "root:software-engineering:frontend:typescript", difficulty: "INTERMEDIATE", durationSeconds: 30 * 60, outline: ["Core types", "Narrowing", "Generics", "Interfaces and utility types"], questions: typescriptQuestions },
  { slug: "react-fundamentals", title: "React Fundamentals", shortDescription: "Components, state, effects, keys, and accessible UI.", description: "A practical React exam focused on durable component fundamentals.", instructions: "Answer each question based on modern React component practices.", categoryKey: "root:software-engineering:frontend:react", difficulty: "INTERMEDIATE", durationSeconds: 30 * 60, outline: ["Components and props", "State and rendering", "Effects", "Keys and accessibility"], questions: reactQuestions }
];
