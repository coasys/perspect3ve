<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import hljs from 'highlight.js';
    import 'highlight.js/styles/github.css'; // choose your preferred style

    let inputElement
    let thinking = false

    const dispatch = createEventDispatcher()

    const apiKey = localStorage.getItem('openaiKey')

    async function chat_with_gpt_3_5(promptMessages) {
        thinking = true
        //const model = "text-davinci-003"; // Replace this with "gpt-3.5-turbo" once it's available.
        const model = "gpt-3.5-turbo"

        // Call the OpenAI API
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey,
                },
                body: JSON.stringify({
                    model,
                    messages: promptMessages,
                    max_tokens: 1024,
                    n: 1,
                    stop: null,
                    temperature: 0.8,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                }),
            });

            console.log(response)
            const data = await response.json()
            console.log(data)

            thinking = false
            // Extract the assistant's reply
            const assistantReply = data.choices[0].message.content;
            return assistantReply;
        } catch (error) {
            console.error("Error calling the OpenAI API:", error);
            thinking = false
        }
    }

// Example usage
let promptMessages = [
  { 
    role: "system", 
    content: `
You are 3ve, the personal assistant AI in Perspect3ve. 
You are mainly there to help create AD4M Subject classes (in Prolog) from user input. 
You'll respond to the user directly and mark Subject class code with "SDNA:" at the start and ":ANDS" at the end, 
so that Perspect3ve can parse that out. 
Make sure that each new Subject class definition uses a new random identifier 
(2nd parameter in "subject_class", 1st parameter in the other predicates),
but ensure the same identifier used throughout all predicate occurrences of the same class definition.
When the user signals that the code is complete, 
provide the the latest version to Perspect3ve to be written to the perspective's social DNA 
by wrapping the code to commit with "WRITE-SDNA:" and ":ANDS-ETIRW"` 
  },
  {
    role: "assistant",
    content: `Hi, I'm 3ve. I'm your personal assistant AI. I'm here to help you create AD4M Subject classes.`
  },
  { 
    role: "user", 
    content: `Create an AD4M Subject class called "Todo". It should have a "state" and a "title" property. The title should resolve to a string applying the literal language. It also should have a "comments" collection.` 
  },
  { 
    role: "assistant", 
    content: `Sure. I have made-up a "todo" AD4M Language to use in the predicates of this Subject class definition.

SDNA:
subject_class("Todo", cjdotdng).
constructor(cjdotdng, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://ready"}]').
instance(cjdotdng, Base) :- triple(Base, "todo://state", _).

property(cjdotdng, "state").
property_getter(cjdotdng, Base, "state", Value) :- triple(Base, "todo://state", Value).
property_setter(cjdotdng, "state", '[{action: "setSingleTarget", source: "this", predicate: "todo://state", target: "value"}]').

property(cjdotdng, "title").
property_resolve(cjdotdng, "title").
property_resolve_language(cjdotdng, "title", "literal").
property_getter(cjdotdng, Base, "title", Value) :- triple(Base, "todo://has_title", Value).
property_setter(cjdotdng, "title", '[{action: "setSingleTarget", source: "this", predicate: "todo://has_title", target: "value"}]').

collection(cjdotdng, "comments").
collection_getter(cjdotdng, Base, "comments", List) :- findall(C, triple(Base, "todo://comment", C), List).
collection_adder(cjdotdng, "comments", '[{action: "addLink", source: "this", predicate: "todo://comment", target: "value"}]').
collection_setter(cjdotdng, "comments", '[{action: "collectionSetter", source: "this", predicate: "todo://comment", target: "value"}]').
:ANDS

What icon should it have in the toolbar? (You can choose from the "Bootstrap" icon set)` 
  },
    { 
        role: "user", 
        content: `The "check" icon. Render todos as circles with the color depending on the state. Also, please add options for the state property, being Ready, Doing and Done.` 
    },
    { 
        role: "assistant", 
        content: `Ok, I have this now:

Sure.

SDNA:
subject_class("Todo", cjdotdng).
constructor(cjdotdng, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://ready"}]').
instance(cjdotdng, Base) :- triple(Base, "todo://state", _).

property(cjdotdng, "state").
property_getter(cjdotdng, Base, "state", Value) :- triple(Base, "todo://state", Value).
property_setter(cjdotdng, "state", '[{action: "setSingleTarget", source: "this", predicate: "todo://state", target: "value"}]').
property_named_option(cjdotdng, "state", "todo://ready", "Ready").
property_named_option(cjdotdng, "state", "todo://doing", "Doing").
property_named_option(cjdotdng, "state", "todo://done", "Done").

property(cjdotdng, "title").
property_resolve(cjdotdng, "title").
property_resolve_language(cjdotdng, "title", "literal").
property_getter(cjdotdng, Base, "title", Value) :- triple(Base, "todo://has_title", Value).
property_setter(cjdotdng, "title", '[{action: "setSingleTarget", source: "this", predicate: "todo://has_title", target: "value"}]').

collection(cjdotdng, "comments").
collection_getter(cjdotdng, Base, "comments", List) :- findall(C, triple(Base, "todo://comment", C), List).
collection_adder(cjdotdng, "comments", '[{action: "addLink", source: "this", predicate: "todo://comment", target: "value"}]').
collection_setter(cjdotdng, "comments", '[{action: "collectionSetter", source: "this", predicate: "todo://comment", target: "value"}]').

p3_class_icon(cjdotdng, "check2-square").
p3_instance_shape(cjdotdng, Instance, "circle").
p3_instance_color(cjdotdng, Instance, "#000055") :- property_getter(c, Instance, "state", "todo://ready").
p3_instance_color(cjdotdng, Instance, "#FFFF00") :- property_getter(c, Instance, "state", "todo://doing").
p3_instance_color(cjdotdng, Instance, "#00FF00") :- property_getter(c, Instance, "state", "todo://done").
:ANDS

Anything else?`
    },
    { 
        role: "user", 
        content: `No, that's it. Please write this to the SDNA.`
    },
    { 
        role: "assistant", 
        content: `Ok...
WRITE-SDNA:
subject_class("Todo", cjdotdng).
constructor(cjdotdng, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://ready"}]').
instance(cjdotdng, Base) :- triple(Base, "todo://state", _).

property(cjdotdng, "state").
property_getter(cjdotdng, Base, "state", Value) :- triple(Base, "todo://state", Value).
property_setter(cjdotdng, "state", '[{action: "setSingleTarget", source: "this", predicate: "todo://state", target: "value"}]').
property_named_option(cjdotdng, "state", "todo://ready", "Ready").
property_named_option(cjdotdng, "state", "todo://doing", "Doing").
property_named_option(cjdotdng, "state", "todo://done", "Done").

property(cjdotdng, "title").
property_resolve(cjdotdng, "title").
property_resolve_language(cjdotdng, "title", "literal").
property_getter(cjdotdng, Base, "title", Value) :- triple(Base, "todo://has_title", Value).
property_setter(cjdotdng, "title", '[{action: "setSingleTarget", source: "this", predicate: "todo://has_title", target: "value"}]').

collection(cjdotdng, "comments").
collection_getter(cjdotdng, Base, "comments", List) :- findall(C, triple(Base, "todo://comment", C), List).
collection_adder(cjdotdng, "comments", '[{action: "addLink", source: "this", predicate: "todo://comment", target: "value"}]').
collection_setter(cjdotdng, "comments", '[{action: "collectionSetter", source: "this", predicate: "todo://comment", target: "value"}]').

p3_class_icon(cjdotdng, "check2-square").
p3_instance_shape(cjdotdng, Instance, "circle").
p3_instance_color(cjdotdng, Instance, "#000055") :- property_getter(c, Instance, "state", "todo://ready").
p3_instance_color(cjdotdng, Instance, "#FFFF00") :- property_getter(c, Instance, "state", "todo://doing").
p3_instance_color(cjdotdng, Instance, "#00FF00") :- property_getter(c, Instance, "state", "todo://done").
:ANDS-ETIRW

Done.`
    },
    { 
        role: "user", 
        content: `Thank you. Let's pretend I just entered the chat.`
    },

];

    let trainingMessageCount = promptMessages.length;

    chat_with_gpt_3_5(promptMessages).then((response) => {
        console.log("Assistant's reply:", response);
        promptMessages = [...promptMessages, {role: "assistant", content: response}]
    });
    
    

    async function submit() {
        const prompt = `${inputElement.value}`
        inputElement.value = ""

        promptMessages = [...promptMessages, {role: "user", content: prompt}]

        const completion = await chat_with_gpt_3_5(promptMessages);

        console.log(completion);
        const writeSplit = split(completion, "WRITE-SDNA:")
        if(writeSplit.code) {
            dispatch("sdnacreated", writeSplit.code)
        }
        promptMessages = [...promptMessages, {role: "assistant", content: completion}]
    }

    function code(content) {
        try{
            return split(content, "SDNA:")
        }catch(e) {
            return {prefix: content}
        }
        
    }

    function split(content, splitter) {
        const split1 = content.split(splitter)
        const prefix = split1[0]
        let code
        let postfix
        const withoutPrefix = split1[1]    
        if(withoutPrefix) {
            const reverseSplitter = splitter.split("").reverse().join("")
            const split2 = withoutPrefix.split(reverseSplitter)
            code = split2[0]
            postfix = split2[1]
        }

        if(code) {
            code = hljs.highlight(code, {language: "prolog"}).value
        }

        return {prefix, code, postfix}
    }
</script>

<ul class="messages">
    {#each promptMessages as item, index}
        {#if index >= trainingMessageCount}
            {#if item.role === "user"}
                <li class="chat-message user" style="color: blue">
                    <div class="user">
                        {item.content}
                    </div>
                    <j-icon class="avatar" name="person" size="1.5rem" color="green"></j-icon>
                </li>
            {:else}
                
                <li class="chat-message">
                    <j-icon class="avatar" name="robot" size="1.5rem" color="green"></j-icon>
                    <div class="assistant">
                        {code(item.content).prefix}
                        {#if code(item.content).code}
                            <pre class="code">
                                <code class="hljs language-prolog">
                                    {@html code(item.content).code}
                                </code>
                            </pre>
                            {code(item.content).postfix}
                        {/if}
                    </div>
                </li>
            {/if}
        {/if}
    {/each}
    {#if thinking}
        <li class="chat-message">
            <j-icon class="avatar" name="robot" size="1.5rem" color="green"></j-icon>
            <div class="assistant">
                Thinking...
            </div>
            <j-spinner size="1.5rem" color="green"></j-spinner>
        </li>
    {/if}
</ul>

<j-flex>
    <j-input
        type="text"
        full="true"
        disabled={thinking}
        bind:this={inputElement}
        on:keydown={(event) => {
            console.log()
            if(event.key === 'Enter') {
                submit()
            }
            event.stopPropagation()
        }}
    />
    <j-button
        variant="primary"
        on:click={submit} 
        disabled={thinking}
    >
        Submit
    </j-button>

</j-flex>

<style>
    .messages {
        list-style: none;
        padding: 0;
        max-height: 550px;
        overflow-y: scroll;
    }
    .avatar {
        margin-right: 0.5rem;
    }
    .chat-message {
        margin: 0.5rem;
        padding: 0.5rem;
        border-radius: 0.5rem;
        list-style: none;
        color: black;
    }
    .user {
        background-color: #e6e6e6;
    }
    .assistant {
        background-color: #f2f2f2;
    }

    .code {
        overflow-x: scroll;
    }
</style>