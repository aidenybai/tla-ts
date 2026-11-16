(*---
description: A variable cannot be replaced by a primed expression.
ref: "tla2sany/semantic/InstanceNode.java#levelCheck"
features: [variables]
outcome: parse-error
---*)
---- MODULE variable_cannot_take_primed ----
---- MODULE I ----
VARIABLE v
====
VARIABLE x
M == INSTANCE I WITH v <- x'
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 28 of module variable_cannot_take_primed
    | Level error in instantiating module 'I':
    | The level of the expression or operator substituted for 'v' 
    | must be at most 1.
    3002:1 Parsing or semantic analysis failed.
---*)
