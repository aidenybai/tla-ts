(*---
description: "@ is lexically scoped, so a definition used in an EXCEPT still has no @."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE at_in_definition_used_in_except ----
a == @
A == [<<1>> EXCEPT ![1] = a]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 6 to line 8, col 6 of module at_in_definition_used_in_except
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
