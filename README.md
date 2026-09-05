# do-assign (🪧)

*do-assign* is an element enhancement that uses the [assign-gingerly](https://github.com/bahrus/assign-gingerly) and [mount-observer](https://github.com/bahrus/mount-observer) proposals/packages/polyfills as the underlying engine.


Merge local values into the host custom element or a remote peer element

## Example 1a 

```html
<script type=module>
class MoodStone extends HTMLElement{
    #isHappy;
    get isHappy(){
        return this.#isHappy;
    }
    set isHappy(nv){
        this.#isHappy = nv;
        this.querySelector('#happy').textContent = nv ? '😊' : '😢'
    }
    #age;
    get age(){
        return this.#age;
    }
    set age(nv){
        this.#age = nv;
        this.querySelector('#age').textContent = nv;

    }
    connectedCallback(){
        this.isHappy = true;
        this.age = 0;
    }
}
customElements.define('mood-stone', MoodStone);
</script>
...
<mood-stone itemscope>
    <div>
        Is Happy: <span id=happy></span>
        Age: <span id=age></span>
    </div>
    <button do-assign='{
        "on": "click",
        "?.isHappy =!": ".",
        "?.age +=": 10

    }'>Do Assign Test</button>
</mood-stone>
```


This applies [the event-binding feature of the assign-gingerly package](https://github.com/bahrus/assign-gingerly/blob/baseline/docs/event-binding.md). The RHS of the attribute can also be an array of such configurations. 

As the link above indicates, there are multiple vectors that one can apply when an event fires.  By default, the syntax above is assigning to the host (mood-stone) with no "from" object to pull values from, so the rhs doesn't have "?."'s.  But we can assign values from the button (which is both the target and the "LHS"), from the event, from the host.  And we can likewise assign to the button, to the host (as above).  If assigning to the host, this would actually allow us to assign things to children of the host based on querySelector.

By default, the options of the assign is set to:

```JS
import {akaMethods, aka, builtInEmoji} from 'assign-gingerly/emojis.js';

const options = {
        akaMethods,
        withMethods: ['appendChild'],
        aka: {
            ...aka,
            
        },
        handlers: builtInEmoji,
}
```


And finally, we can dispatch events with other names, stop propagation, prevent default behavior.  Everything that the event-binding link above supports, this element enhancement supports, for free, due to using the assign-gingerly's implementation.

## Security

Because `do-assign` lets an HTML attribute drive assign-gingerly's full `withMethods` / `akaMethods` power — arbitrary property assignment and method calls on the host — it applies assign-gingerly's [strict default permissions profile](https://github.com/bahrus/assign-gingerly/blob/baseline/docs/assign-permissions.md#strict-default-profile-strictdefaultpermissions) (`strictDefaultPermissions`) to every assignment it performs, via a `PermissionProcessor` passed down to `attachEventListener`. This closes off the well-known DOM XSS sinks by default, even though the `do-assign` attribute itself is assumed to come from trusted markup:

- **Blocked outright:** `innerHTML`, `outerHTML`, `srcdoc`, `cssText`, and the methods `insertAdjacentHTML`, `setHTMLUnsafe`, `execCommand`.
- **Same-origin only:** `src`, `href`, `action`, `formAction` (as both properties and attributes) — cross-origin values are dropped, blocking `javascript:`/`data:`/exfiltration URLs while normal same-app links, images, and form actions keep working.
- **Blocked as attributes:** inline event-handler attributes (`onclick`, `onerror`, `onload`, etc.) — the browser turns these into live handlers as soon as they're set, so there's no safe form of them.

A blocked assignment is skipped with a `console.warn`, not a thrown error, so a page keeps running with the sink neutralized. This profile is a sensible default, not a hard limit of the underlying engine — a consumer embedding `do-assign` in a context where these restrictions don't fit can fork/extend the permissions profile in assign-gingerly's own docs linked above.

## Relationship to do-invoke, do-inc, do-toggle

do-assign covers most of the same ground as [do-invoke](https://github.com/bahrus/do-invoke), [do-inc](https://github.com/bahrus/do-inc), [do-toggle](https://github.com/bahrus/do-toggle) and [be-dispatching](https://github.com/bahrus/be-dispatching). The key differences:

- **do-invoke**, **do-inc**, and **do-toggle**, **be-dispatching** use a string DSL (no JSON required) and include inferencing logic — they can figure out the event type, target property, etc. from context, so you can often be less explicit. The intent is arguably more obvious at a glance for their specific use cases.
- **do-assign** uses JSON syntax and the full power of [assign-gingerly](https://github.com/bahrus/assign-gingerly) operators (`=!` for toggle, `+=` for increment, method calls via `?.classList?.add`, etc.). It's more general-purpose — a single enhancement that can handle toggling, incrementing, method invocation, and arbitrary property assignment in one attribute.

Choose do-merge when you need to combine multiple operations or want the full expressiveness of assign-gingerly. Choose the specialized enhancements when brevity and self-documenting intent matter more.

### Editing JSON in HTML

Two options for a better authoring experience:

1. **json-in-html** — A VS Code / Kiro extension that adds syntax highlighting for JSON embedded in HTML attributes. Available in both the VS Code and Kiro marketplaces.
2. **Build-time authoring** — Write your merge instructions in a `*.mjs` file that serializes to JSON, then inject the result into your HTML at build time. This gives you full editor support (comments, trailing commas, template literals) while producing valid JSON for the browser.




### Running demos

```bash
npm run serve
```

Then navigate to `http://localhost:8000/demo/Example1a.html` (the spa-ssi server handles the `#include virtual` directive for the import map).


## Viewing Demos Locally

Any web server that can serve static files will do and server-side includes, but...


1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule add https://github.com/bahrus/types.git types
6. > git submodule update --init --recursive
7. > npm install
8. > npm run serve
9. Open http://localhost:8000/ in a modern browser

## Running Tests

```
> npm run test
```




