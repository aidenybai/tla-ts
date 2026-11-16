(*---
description: "With a variable present, a constant cannot be replaced by a state-level expression."
ref: "tla2sany/semantic/InstanceNode.java#levelCheck"
features: [variables]
outcome: parse-error
---*)
---- MODULE constant_cannot_take_variable ----
---- MODULE I ----
CONSTANT k
VARIABLE v
====
VARIABLE x
M == INSTANCE I WITH k <- x, v <- x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 1 to line 13, col 35 of module constant_cannot_take_variable
    | Level error in instantiating module 'I':
    | The level of the expression or operator substituted for 'k' 
    | must be at most 0.
    3002:1 Parsing or semantic analysis failed.
---*)
