---
sidebar_position: 2
---

# Send Media

### What does it do?
Sends a message to the user with some kind of media (image, video, or file).
___
## 1. Syntax
### Image/Video
```yaml
  <node_name>:
    type: notify
    media: <link_to_file>
    caption: "<text_to_send_with_media>"
    filename: media.ext
    on_complete: <next_node>
    delay_complete_seconds: 3
```
### Document
```yaml
  <node_name>:
    type: notify
    doc: <link_to_file>
    caption: "<text_to_send_with_document>"
    filename: file.ext
    on_complete: <next_node>
    delay_complete_seconds: 5
```

### required params
- `type` type of the node
- `doc` / `media` link to the document/media file
- `on_complete` next node after complete

### optional params
- `delay_complete_seconds` time in seconds to wait before the next node (integer, `1`–`60`). Files take time to be sent — strongly recommended, without it the next node may fire before the file is delivered
- `caption` text to send with the media/doc (single string, use `\n` for new lines)
- `filename` custom filename for the media/document
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Send an image
```yaml
  send_image:
    type: notify
    media: https://storage.googleapis.com/mybucket/welcome.png
    caption: "Welcome to our service!"
    filename: welcome_image.png
    on_complete: main_menu
    delay_complete_seconds: 3
```

### Send a branded logo/image before the flow starts
```yaml
  start_image:
    type: notify
    media: "https://storage.googleapis.com/texter-public-files/customers/yulia/logo.jpeg"
    filename: "yullia_logo.jpg"
    on_complete: start_msg
    delay_complete_seconds: 5
```

### Send a document
```yaml
  send_file:
    type: notify
    doc: https://storage.googleapis.com/mybucket/monthly_update.pdf
    caption: "Monthly update report"
    filename: monthly_update.pdf
    on_complete: ask_continue_menu
    delay_complete_seconds: 5
```

### Send a video
```yaml
  send_video:
    type: notify
    media: https://storage.googleapis.com/mybucket/tutorial.mp4
    caption: "Watch this short tutorial"
    filename: tutorial.mp4
    on_complete: after_video_menu
    delay_complete_seconds: 5
```

### Dynamic media from bot state (e.g. shared file link)
```yaml
  send_certificate:
    type: notify
    doc: "%state:node.share_certificate.link%"
    caption: "Here is your certificate, %chat:title%"
    filename: certificate.pdf
    on_complete: main_menu
    delay_complete_seconds: 5
```

:::danger
Always include `delay_complete_seconds` when sending media. Without it, the next node may execute before the file is delivered to the user, causing messages to appear out of order.
:::

:::warning[Max delay is 60 seconds]
`delay_complete_seconds` accepts an integer between `1` and `60`. Values above 60 will cause timeout problems and fail validation.
:::

:::tip
For images and video, use `media:`. For documents (PDF, Word, etc.), use `doc:`. Both support `caption` and `filename`.
:::
