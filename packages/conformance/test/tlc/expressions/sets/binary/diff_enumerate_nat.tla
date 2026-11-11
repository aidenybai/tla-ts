(*---
description: "Enumerating Nat \\ S is an error."
ref: "tlc2/value/impl/SetDiffValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE diff_enumerate_nat ----
EXTENDS Integers, FiniteSets
Test == Cardinality(Nat \ {1}) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module diff_enumerate_nat failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in diff_enumerate_nat
    1. Line 11, column 29 to line 11, column 32 in diff_enumerate_nat
    2. Line 9, column 9 to line 9, column 34 in diff_enumerate_nat
    3. Line 9, column 9 to line 9, column 30 in diff_enumerate_nat
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in diff_enumerate_nat
    1. Line 12, column 30 to line 12, column 33 in diff_enumerate_nat
    2. Line 9, column 9 to line 9, column 34 in diff_enumerate_nat
    3. Line 9, column 9 to line 9, column 30 in diff_enumerate_nat
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in diff_enumerate_nat
    1. Line 13, column 8 to line 13, column 32 in diff_enumerate_nat
    2. Line 13, column 29 to line 13, column 32 in diff_enumerate_nat
    3. Line 9, column 9 to line 9, column 34 in diff_enumerate_nat
    4. Line 9, column 9 to line 9, column 30 in diff_enumerate_nat
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in diff_enumerate_nat
    1. Line 12, column 12 to line 12, column 36 in diff_enumerate_nat
    2. Line 12, column 33 to line 12, column 36 in diff_enumerate_nat
    3. Line 9, column 9 to line 9, column 34 in diff_enumerate_nat
    4. Line 9, column 9 to line 9, column 30 in diff_enumerate_nat
---*)
