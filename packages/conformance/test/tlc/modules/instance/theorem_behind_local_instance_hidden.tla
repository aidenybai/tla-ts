(*---
description: A local-instanced theorem name is not visible two levels up.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [instance]
outcome: parse-error
---*)
---- MODULE theorem_behind_local_instance_hidden ----
---- MODULE I ----
THEOREM T == 1 = 1
====
---- MODULE J ----
LOCAL INSTANCE I
====
INSTANCE J
Test == T
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 15, col 9 to line 15, col 9 of module theorem_behind_local_instance_hidden
    | Unknown operator: `T'.
    3002:1 Parsing or semantic analysis failed.
---*)
