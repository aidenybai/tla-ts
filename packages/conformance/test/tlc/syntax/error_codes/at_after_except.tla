(*---
description: "4261 fires for @ after an EXCEPT ends."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE at_after_except ----
A == [<<1>> EXCEPT ![1] = 1] = @
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 32 to line 8, col 32 of module at_after_except
    | @ used where its meaning is not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
