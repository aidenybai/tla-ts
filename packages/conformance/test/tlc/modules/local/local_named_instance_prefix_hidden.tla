(*---
description: "A LOCAL named instance's prefix is not visible through EXTENDS."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [local]
outcome: parse-error
---*)
---- MODULE local_named_instance_prefix_hidden ----
---- MODULE I ----
LOCAL M == INSTANCE Naturals
====
---- MODULE J ----
EXTENDS I
B == M!Nat
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 6 to line 13, col 10 of module local_named_instance_prefix_hidden
    | Unknown operator: `M!Nat'.
    3002:1 Parsing or semantic analysis failed.
---*)
