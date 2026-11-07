(*---
description: Ported from TLC's PrintTraceExceptionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/PrintTraceExceptionTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS Alias
args:
  - -deadlock
---*)
---- MODULE PrintTraceException ----
EXTENDS Naturals
VARIABLES x, y

Init == x = 0 /\ y = 0

Next == \/ x < 5 /\ x' = x + 1 /\ y' = y
        \/ y < 5 /\ y' = y + 1 /\ x' = x

\* Violated by the fourth state.
Inv == x < 3

\* %d does not fit the name of a field, which is a string, so printing any state
\* of the error trace throws.
Alias == [_format |-> "%d = %s\n", x |-> x, y |-> y]
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.util.IllegalFormatConversionException
    : d != java.lang.String
    2199:0 8 states generated, 7 distinct states found, 2 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
