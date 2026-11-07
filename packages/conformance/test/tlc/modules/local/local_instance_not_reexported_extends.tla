(*---
description: Names brought by LOCAL INSTANCE do not pass on through EXTENDS.
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [local]
outcome: parse-error
---*)
---- MODULE local_instance_not_reexported_extends ----
---- MODULE I ----
LOCAL INSTANCE Naturals
====
---- MODULE J ----
EXTENDS I
B == 1 + 1
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 13, col 8 to line 13, col 8 of module local_instance_not_reexported_extends
    | Could not find declaration or definition of symbol '+'.
    | line 13, col 6 to line 13, col 10 of module local_instance_not_reexported_extends
    | Couldn't resolve infix operator symbol `+'.
    3002:1 Parsing or semantic analysis failed.
---*)
