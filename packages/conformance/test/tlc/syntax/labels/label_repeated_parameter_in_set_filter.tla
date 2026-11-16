(*---
description: A label in a set filter may not repeat the bound name.
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_repeated_parameter_in_set_filter ----
Op == {x \in {1} : l(x, x):: TRUE}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 20 to line 8, col 33 of module label_repeated_parameter_in_set_filter
    | Repeated formal parameter x 
    | in label `l'.
    3002:1 Parsing or semantic analysis failed.
---*)
