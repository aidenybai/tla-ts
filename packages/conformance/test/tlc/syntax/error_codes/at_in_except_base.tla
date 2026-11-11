(*---
description: "4261 fires for @ in the base of an outermost EXCEPT."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE at_in_except_base ----
A == [@ EXCEPT ![1] = 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 7 to line 8, col 7 of module at_in_except_base
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
