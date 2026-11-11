(*---
description: A bound name of an enclosing quantifier must be a parameter too.
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_missing_outer_of_nested ----
Op == \A x \in {1} : \A y \in {2} : l(y):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 37 to line 8, col 47 of module parameter_missing_outer_of_nested
    | Label l must contain formal parameter `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
