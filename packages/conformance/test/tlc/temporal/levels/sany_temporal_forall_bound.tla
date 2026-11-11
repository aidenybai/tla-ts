(*---
description: 'Temporal quantifiers do not take bounds, a parse error.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_temporal_forall_bound ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == \AA y \in {1} : y = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "\in" at line 16, column 15 and token "y" 
    | Residual stack trace follows:
    | Bound Quantified Expression starting at line 16, column 9.
    | Expression starting at line 16, column 9.
    | Definition starting at line 16, column 1.
    | Module body starting at line 13, column 1.
    | Module definition starting at line 11, column 1.
    | Fatal errors while parsing TLA+ spec in file sany_temporal_forall_bound
    | In module sany_temporal_forall_bound
    | Could not parse module sany_temporal_forall_bound from file sany_temporal_forall_bound.tla
    | *** Errors: 1
    | In module sany_temporal_forall_bound
    | Could not parse module sany_temporal_forall_bound from file sany_temporal_forall_bound.tla
    3002:1 Parsing or semantic analysis failed.
---*)
