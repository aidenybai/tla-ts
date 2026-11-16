(*---
description: "A nested module's definitions are not visible without an INSTANCE."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
outcome: parse-error
---*)
---- MODULE inner_not_visible_without_instance ----
---- MODULE I ----
A == 8
====
Test == A = 8
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 9 to line 11, col 9 of module inner_not_visible_without_instance
    | Unknown operator: `A'.
    3002:1 Parsing or semantic analysis failed.
---*)
