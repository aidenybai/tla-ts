(*---
description: A _format field that isn't a string makes printing the trace throw a ClassCastException, reported after the violation message, while the exit stays the violation's.
ref: tlc2/value/impl/RecordValue.java#toString
features:
  - tlc-bug
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  ALIAS A
---*)
---- MODULE format_not_string ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
A == [_format |-> 1, v |-> x]
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
    The exception was a java.lang.ClassCastException
    : class tlc2.value.impl.IntValue cannot be cast to class tlc2.value.impl.StringValue (tlc2.value.impl.IntValue and tlc2.value.impl.StringValue are in unnamed module of loader 'app')
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
