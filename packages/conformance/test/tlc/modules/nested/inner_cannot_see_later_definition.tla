(*---
description: A nested module cannot see definitions after it.
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
outcome: parse-error
---*)
---- MODULE inner_cannot_see_later_definition ----
---- MODULE I ----
B == A
====
A == 7
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 6 of module inner_cannot_see_later_definition
    | Unknown operator: `A'.
    3002:1 Parsing or semantic analysis failed.
---*)
