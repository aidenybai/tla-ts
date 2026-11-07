(*---
description: "A function on an interval against a function on strings fails on the key."
ref: "tlc2/value/impl/FcnRcdValue.java#compareToInterval"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE interval_function_vs_string_keys ----
EXTENDS Integers, FiniteSets, TLC
Test == Cardinality({[i \in 1..1 |-> 0], ("a" :> 0)}) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_function_vs_string_keys
    1. Line 11, column 29 to line 11, column 32 in interval_function_vs_string_keys
    2. Line 9, column 9 to line 9, column 57 in interval_function_vs_string_keys
    3. Line 9, column 9 to line 9, column 53 in interval_function_vs_string_keys
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in interval_function_vs_string_keys
    1. Line 12, column 30 to line 12, column 33 in interval_function_vs_string_keys
    2. Line 9, column 9 to line 9, column 57 in interval_function_vs_string_keys
    3. Line 9, column 9 to line 9, column 53 in interval_function_vs_string_keys
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_function_vs_string_keys
    1. Line 13, column 8 to line 13, column 32 in interval_function_vs_string_keys
    2. Line 13, column 29 to line 13, column 32 in interval_function_vs_string_keys
    3. Line 9, column 9 to line 9, column 57 in interval_function_vs_string_keys
    4. Line 9, column 9 to line 9, column 53 in interval_function_vs_string_keys
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer with non-integer
    "a".
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in interval_function_vs_string_keys
    1. Line 12, column 12 to line 12, column 36 in interval_function_vs_string_keys
    2. Line 12, column 33 to line 12, column 36 in interval_function_vs_string_keys
    3. Line 9, column 9 to line 9, column 57 in interval_function_vs_string_keys
    4. Line 9, column 9 to line 9, column 53 in interval_function_vs_string_keys
---*)
