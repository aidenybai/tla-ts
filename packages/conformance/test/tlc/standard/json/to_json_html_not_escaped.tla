(*---
description: Gson's HTML escaping is off in JsonElement.toString, so < stays.
ref: tlc2/module/Json.java#getNode
features:
  - Json
flags:
  - expression
outcome: success
---*)
---- MODULE to_json_html_not_escaped ----
EXTENDS Json, TLC, Naturals
Test == ToJson("<a>") = "\"<a>\""
====

(*--- recorded
all:
  exit: 0
---*)
