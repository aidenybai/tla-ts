(*---
description: A LOCAL definition is not instanced.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [local]
outcome: parse-error
---*)
---- MODULE hidden_through_unnamed_instance ----
---- MODULE I ----
LOCAL Hid == 1
Pub == Hid
====
INSTANCE I
Test == Hid = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 9 to line 13, col 11 of module hidden_through_unnamed_instance
    | Unknown operator: `Hid'.
    3002:1 Parsing or semantic analysis failed.
---*)
