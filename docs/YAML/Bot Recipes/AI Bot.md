---
sidebar_position: 1
---

# AI Bot

For integrating an AI bot (external bot) with Texter — paste this snippet as part of the AI onboarding so you can start testing the AI agent using the command `AI_TEST`.

```yaml
# Implement for testing only first 
  start:	
    type: func
    func_type: system
    func_id: keywordsRoute
    params:
      bot_change: AI_TEST
    on_failure: start_original
    on_complete: start_original
 
  bot_change:  
    type: func
    func_type: chat
    func_id: externalBot
    on_complete: back_to_texter
    
  back_to_texter:
    type: func
    func_type: system
    func_id: switchNode
    params:
      input: "%chat:crmData.aiTerminateReason%"
      cases:
        "human_handoff": ai_handoff
        "resolved_convo": whats_next
        "Reached message limit": ai_reached_limit_msg
        "Inactivity": ai_inactivity_msg
        "Error": ai_error_msg
    on_complete: whats_next
  
  ai_reached_limit_msg:
    type: notify
    messages:
      - "הגעת למכסת ההודעות המקסימלית שלך עם הבינה המלאכותית. אנחנו מעבירים את השיחה לבוט הרגיל שלנו"
    on_complete: whats_next
  
  ai_inactivity_msg:
    type: notify
    messages:
      - "מכיוון שחלף זמן מה ללא תגובה, החזרנו אותך לבוט הרגיל להמשך טיפול."
    on_complete: whats_next
  
  ai_error_msg:
    type: notify
    messages:
      - "מצטערים, הייתה תקלה במערכת הבינה המלאכותית ולכן אנו מחזירים אותך לבוט הרגיל שלנו."
    on_complete: whats_next

  ai_handoff:
    type: notify
    messages:
      - "כאן פנייתך הייתה עוברת לנציג והצ'אט היה ממתין לטיפול"
      - "לצורך הבדיקות אני סוגר את פנייתך וניתן לפנות שוב עם הפקודה AI_TEST"
    on_complete: resolved

  whats_next:
    type: prompt
    prompt_type: choice
    interactive: buttons
    messages:
      - "האם אפשר לעזור במשהו נוסף?"
    choices:
      - title: "לנציג אנושי"
        on_select: ai_handoff
      - title: "סיימתי"
        on_select: resolved_msg
    on_failure: resolved_msg

  resolved_msg:
    type: notify
    messages:
      - "פנייתך נסגרה, שיהיה המשך יום נעים"
      - "ניתן לשלוח שוב את הפקודה AI_TEST כדי להפעיל את הבוט מחדש"
    on_complete: resolved
```

## What to change in the existing bot

- Rename the existing `start` node to `start_original` so the new `start` node above can fall through to it via `on_failure` / `on_complete`.
