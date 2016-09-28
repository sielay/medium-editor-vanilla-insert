# Medium Editor Vanilla Insert

Extension to [MediumEditor](https://github.com/yabwe/medium-editor) inspired by [](http://linkesch.com/medium-editor-insert-plugin/) but without dependencies.

It's written with Browserify in mind, but should work for most cases.

`npm i --save medium-editor-vanilla-insert`

## Example

```javascript
const
  MediumEditor = require('medium-editor'),
  Insert = require('medium-editor-vanilla-insert')({
    MediumEditor: MediumEditor
  });

new MediumEditor(div, {
  extensions: {
    insert: new Insert({
      buttons: ['insert-image']
    })
  }
});
```

Same like for toolbar you can add your buttons as extensions as long they expose method `getButton`. Just specify extension in `buttons` option.

`getButton` will get two arguments. First will be current MediumEditor instance. Second will be getter method to `HTMLElement` in which context injector was shown.

## License

MIT
