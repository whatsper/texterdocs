# Share File

### What does it do?
Generates a signed, shareable download link for a file that was uploaded by the user during the conversation. The link can then be sent to external systems (e.g., CRM) via a `request` node. The generated link is stored at `%state:node.<node_name>.link%`.
___
## 1. Syntax
```yaml
  <node_name>:
    type: func
    func_type: system
    func_id: shareFile
    params:
      file_node: <node_name_where_file_was_uploaded>
    on_complete: <next_node>
```

### required params
- `type` type of the node
- `func_type` here it will be a system function
- `func_id` what function are we calling (`shareFile`)
- `params.file_node` the name of the prompt node where the user uploaded the file (the file ID is read from that node's stored state)
- `on_complete` next node

### optional params
- `params.link_ttl` link expiration time in **milliseconds** (default: `604800000` — 7 days)
- `on_failure` fallback node (triggered if the file ID is not found or invalid)
- `department` assigns the chat to a department
- `agent` assigns the chat to a specific agent (email address or CRM ID as defined in the Texter agents manager)

___
## 2. Examples

### Generate a share link for an uploaded document
```yaml
  upload_doc_user:
    type: prompt
    prompt_type: text
    messages:
      - "Please upload your document"
    on_complete: share_file

  share_file:
    type: func
    func_type: system
    func_id: shareFile
    params:
      file_node: upload_doc_user
    on_complete: send_to_crm
```

### Generate a link with a custom TTL (1 day)
```yaml
  share_file_short:
    type: func
    func_type: system
    func_id: shareFile
    params:
      file_node: upload_doc_user
      link_ttl: 86400000
    on_complete: send_to_crm
```

### Use the generated link in a request
After `shareFile` runs, the link is available at `%state:node.<node_name>.link%`:

```yaml
  send_to_crm:
    type: func
    func_type: system
    func_id: request
    params:
      url: "https://api.example.com/upload"
      method: "post"
      headers:
        Content-Type: application/json
      data:
        contact_id: "%chat:crmData.contact_id%"
        title: "%state:node.upload_doc_user.text%"
        url: "%state:node.share_file.link%"
    on_complete: upload_complete
```

:::tip
The `file_node` must point to a prompt node where the user sent a media message (image, document, video, etc.). If the referenced node has no valid file ID, the node routes to `on_failure`.
:::
