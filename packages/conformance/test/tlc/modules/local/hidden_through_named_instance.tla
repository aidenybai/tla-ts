(*---
description: "A LOCAL definition has no M! name."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [local]
outcome: parse-error
---*)
---- MODULE hidden_through_named_instance ----
---- MODULE I ----
LOCAL Hid == 1
Pub == Hid
====
M == INSTANCE I
Test == M!Hid = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 9 to line 13, col 13 of module hidden_through_named_instance
    | Unknown operator: `M!Hid'.
    3002:1 Parsing or semantic analysis failed.
---*)
