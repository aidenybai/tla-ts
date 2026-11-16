(*---
description: 'A recursive temporal operator with a state guard recurses without bound during translation: stack overflow.'
ref: tlc2/tool/liveness/Liveness.java#astToLiveAppl
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE recursive_nonterminating_stack_overflow ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
RECURSIVE Reach(_)
Reach(n) == IF x = 0 THEN <>(x = 2) ELSE Reach(n + 1)
Prop == <>(x = 2) /\ Reach(1)
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
