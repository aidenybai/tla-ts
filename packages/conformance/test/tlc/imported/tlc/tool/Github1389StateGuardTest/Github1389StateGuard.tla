(*---
description: Ported from TLC's Github1389StateGuardTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1389StateGuardTest.java
features:
  - tlc-regression
outcome: tlc-error
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
  PROPERTY Prop
args:
  - -deadlock
---*)
--------------------------- MODULE Github1389StateGuard ---------------------------
\* Regression test for https://github.com/tlaplus/tlaplus/issues/1389
\* exercising the error-handling path when a RECURSIVE operator at
\* temporal level is applied to a state-level argument.

EXTENDS Naturals

VARIABLE x

RECURSIVE op(_)
op(n) == IF n = 0 THEN <>(x = 0) ELSE op(n - 1)

Init == x = 0
Next == x' \in 0..3
Spec == Init /\ [][Next]_x

\* op's parameter is bound to x (state-level); the guard `n = 0`
\* therefore references a state variable and never resolves during
\* tableau construction.
Prop == op(x)
==================================================================

(*--- recorded
all:
  exit: 255
  transcript: |-
    1005:1 This was a Java StackOverflowError. It was probably the result
    of an incorrect recursive function definition that caused TLC to enter
    an infinite loop when trying to compute the function or its application
    to an element in its putative domain.
---*)
