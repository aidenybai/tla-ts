(*---
description: 'SANY rejects -+-> with a primed argument.'
ref: tla2sany/semantic/OpApplNode.java#levelCheck
features: [liveness, levels]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE sany_guarantee_primed ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Prop == (x' = 1) -+-> (x = 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 9 to line 16, col 29 of module sany_guarantee_primed
    | Action used where only temporal formula or state predicate allowed.
    3002:1 Parsing or semantic analysis failed.
---*)
