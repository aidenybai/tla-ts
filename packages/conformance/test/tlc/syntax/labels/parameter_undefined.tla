(*---
description: A label parameter that names nothing is illegal.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_undefined ----
Op == \A x \in {1} : l(x, y):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 27 to line 8, col 27 of module parameter_undefined
    | Illegal parameter y of label `l'.
    | line 8, col 22 to line 8, col 35 of module parameter_undefined
    | Label l declares extra parameter(s)  y  
    3002:1 Parsing or semantic analysis failed.
---*)
