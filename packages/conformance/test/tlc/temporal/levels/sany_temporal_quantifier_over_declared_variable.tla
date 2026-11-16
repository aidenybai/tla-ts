(*---
description: 'Temporally quantifying with the name of a declared variable is a redeclaration error.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_temporal_quantifier_over_declared_variable ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == \EE x : x = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 13 to line 16, col 13 of module sany_temporal_quantifier_over_declared_variable
    | Multiply-defined symbol 'x': this definition or declaration conflicts 
    | with the one at line 13, col 10 to line 13, col 10 of module sany_temporal_quantifier_over_declared_variable.
    3002:1 Parsing or semantic analysis failed.
---*)
