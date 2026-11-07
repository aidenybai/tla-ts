(*---
description: Names brought by LOCAL INSTANCE do not pass on through INSTANCE.
ref: "tla2sany/semantic/Generator.java#generateInstance"
features: [local]
outcome: parse-error
---*)
---- MODULE local_instance_not_reexported_instance ----
---- MODULE I ----
LOCAL INSTANCE Naturals
====
INSTANCE I
Test == (1 + 1) = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 12, col 12 to line 12, col 12 of module local_instance_not_reexported_instance
    | Could not find declaration or definition of symbol '+'.
    | line 12, col 10 to line 12, col 14 of module local_instance_not_reexported_instance
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
