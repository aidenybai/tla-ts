(*---
description: Ported from TLC's Github696bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github696bTest.java
features:
  - tlc-regression
outcome: tlc-error
config: |-
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -deadlock
---*)
------------------ MODULE Github696b -------------------
EXTENDS Integers, TLCExt

VARIABLE v

Init == /\ v = {TLCModelValue("A_a"), TLCModelValue("B_a")}
 
Next == UNCHANGED v

Inv == TLCModelValue("B_a") \in v

=======================================================

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to compare the differently-typed model values B_a and A_a
---*)
