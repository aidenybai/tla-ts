(*---
description: 'Expansion of a RECURSIVE temporal operator whose IF guard depends on state never terminates and TLC reports a stack overflow.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE recursive_fairness_state_guard_overflows ----
EXTENDS Naturals
VARIABLE x
A == x < 2 /\ x' = x + 1
Prop == <>(x = 2)
RECURSIVE Fair
Fair == IF x = 0 THEN WF_x(A) ELSE Fair
Spec == x = 0 /\ [][A]_x /\ Fair
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
---*)
