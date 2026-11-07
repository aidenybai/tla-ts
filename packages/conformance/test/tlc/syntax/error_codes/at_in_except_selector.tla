(*---
description: "4261 fires for @ in an outermost EXCEPT's selector."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE at_in_except_selector ----
A == [<<1>> EXCEPT ![@] = 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 22 to line 8, col 22 of module at_in_except_selector
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
