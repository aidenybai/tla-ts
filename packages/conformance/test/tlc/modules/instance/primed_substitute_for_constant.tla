(*---
description: A constant cannot take a primed expression when the module also declares variables.
ref: "tla2sany/semantic/InstanceNode.java#levelCheck"
features: [instance]
outcome: parse-error
---*)
---- MODULE primed_substitute_for_constant ----
---- MODULE I ----
CONSTANT c
VARIABLE v
====
VARIABLE w
INSTANCE I WITH c <- w', v <- w
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 13, col 1 to line 13, col 31 of module primed_substitute_for_constant
    | Level error in instantiating module 'I':
    | The level of the expression or operator substituted for 'c' 
    | must be at most 0.
    3002:1 Parsing or semantic analysis failed.
---*)
