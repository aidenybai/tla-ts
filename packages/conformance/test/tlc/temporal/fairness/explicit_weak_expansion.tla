(*---
description: 'SANY rejects a hand-written WF expansion where <> is applied to a disjunction containing an angle action.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: parse-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE explicit_weak_expansion ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)

Spec == x = 0 /\ [][A]_x /\ []<>(~ENABLED <<A>>_x \/ <<A>>_x)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 17, col 31 to line 17, col 61 of module explicit_weak_expansion
    | <> followed by action not of form <<A>>_v.
    3002:1 Parsing or semantic analysis failed.
---*)
