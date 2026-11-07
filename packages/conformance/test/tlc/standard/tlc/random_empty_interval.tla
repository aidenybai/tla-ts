(*---
description: An empty interval fails with the interval's own out-of-bounds message.
ref: tlc2/value/impl/IntervalValue.java#elementAt
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE random_empty_interval ----
EXTENDS TLC, Naturals
Test == RandomElement(3..1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_empty_interval
    1. Line 14, column 29 to line 14, column 32 in random_empty_interval
    2. Line 12, column 9 to line 12, column 31 in random_empty_interval
    3. Line 12, column 9 to line 12, column 27 in random_empty_interval
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in random_empty_interval
    1. Line 15, column 30 to line 15, column 33 in random_empty_interval
    2. Line 12, column 9 to line 12, column 31 in random_empty_interval
    3. Line 12, column 9 to line 12, column 27 in random_empty_interval
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_empty_interval
    1. Line 16, column 8 to line 16, column 32 in random_empty_interval
    2. Line 16, column 29 to line 16, column 32 in random_empty_interval
    3. Line 12, column 9 to line 12, column 31 in random_empty_interval
    4. Line 12, column 9 to line 12, column 27 in random_empty_interval
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.RandomElement(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to retrieve out-of-bounds element from the interval value {}.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_empty_interval
    1. Line 15, column 12 to line 15, column 36 in random_empty_interval
    2. Line 15, column 33 to line 15, column 36 in random_empty_interval
    3. Line 12, column 9 to line 12, column 31 in random_empty_interval
    4. Line 12, column 9 to line 12, column 27 in random_empty_interval
---*)
