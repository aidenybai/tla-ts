(*---
description: A label parameter that names a definition is illegal.
ref: "tla2sany/semantic/Generator.java#generateLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE parameter_is_definition ----
c == 1
Op == \A x \in {1} : l(x, c):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 27 to line 9, col 27 of module parameter_is_definition
    | Illegal parameter c of label `l'.
    | line 9, col 22 to line 9, col 35 of module parameter_is_definition
    | Label l declares extra parameter(s)  c  
    3002:1 Parsing or semantic analysis failed.
---*)
