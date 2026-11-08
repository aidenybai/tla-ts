(*---
description: An evaluation error in a later disjunct stops TLC even though an earlier disjunct already gave a state.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE or_error_in_second ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 \/ x = 1 + "a"
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Naturals.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in or_error_in_second
    1. Line 13, column 18 to line 13, column 28 in or_error_in_second
    2. Line 13, column 22 to line 13, column 28 in or_error_in_second
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
