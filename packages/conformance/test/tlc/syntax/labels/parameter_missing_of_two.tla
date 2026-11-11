(*---
description: Every bound name in scope of a label must be a parameter.
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_missing_of_two ----
Op == \A x \in {1}, y \in {2} : l(x):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 33 to line 8, col 43 of module parameter_missing_of_two
    | Label l must contain formal parameter `y'.
    3002:1 Parsing or semantic analysis failed.
---*)
