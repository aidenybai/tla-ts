(*---
description: A label parameter may not be listed twice even if the other bound name is also listed.
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_repeated_other_way ----
Op == \A x \in {1}, y \in {2} : l(x, y, x):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 33 to line 8, col 49 of module parameter_repeated_other_way
    | Repeated formal parameter x 
    | in label `l'.
    3002:1 Parsing or semantic analysis failed.
---*)
