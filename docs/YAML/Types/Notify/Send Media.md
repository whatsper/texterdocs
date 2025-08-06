# Send media

### What does it do?
Sends a message to user with some kind of media (image, video or file).
___
## 1. Syntax
### media
```
<node_name>:
  type: notify
  media: <link_to_do_in_firebase>
  caption: "<text_to_send_with_media>"
  filename: media.ext
  on_complete: <next_function>
  delay_complete_seconds: 3
```
### document
```
<node_name>:
  type: notify
  doc: <link_to_do_in_firebase>
  caption: "<text_to_send_with_document>"
  filename: file.ext
  on_complete: <next_function>
  delay_complete_seconds: 5
```

### required params
- `type` type of the node
- `doc` / `media` link to document/media in firebase
- `caption` only 1 line of text to send with media/doc
- `on_complete` next function to do after complete (can be either a node or a function)
- `delay_complete_seconds` time to wait before next node (files takes time to be sent, without it, it can be sent after the next node)

### optional params

___
## 2. Example
### media
```
send_image:
  type: notify
  media: linkToImageFirebase.png
  caption: "Welcome to whatsper!"
  filename: welcome_image.png
  on_complete: main_menu
  delay_complete_seconds: 3
```
### document
```
send_file:
  type: notify
  doc: linkToFileFirebase.pdf
  caption: "Monthly update about us"
  filename: monthly_update.pdf
  on_complete: ask_continue_menu
  delay_complete_seconds: 5
```
