(*---
description: Nat \X S cannot be sized.
ref: tlc2/value/impl/SetOfTuplesValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_nat_cross ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(Nat \X {1}) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module card_nat_cross failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_nat_cross
    1. Line 14, column 29 to line 14, column 32 in card_nat_cross
    2. Line 12, column 9 to line 12, column 35 in card_nat_cross
    3. Line 12, column 9 to line 12, column 31 in card_nat_cross
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
    Attempted to compute the number of elements in the overridden value Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_nat_cross
    1. Line 15, column 30 to line 15, column 33 in card_nat_cross
    2. Line 12, column 9 to line 12, column 35 in card_nat_cross
    3. Line 12, column 9 to line 12, column 31 in card_nat_cross
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_nat_cross
    1. Line 16, column 8 to line 16, column 32 in card_nat_cross
    2. Line 16, column 29 to line 16, column 32 in card_nat_cross
    3. Line 12, column 9 to line 12, column 35 in card_nat_cross
    4. Line 12, column 9 to line 12, column 31 in card_nat_cross
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_nat_cross
    1. Line 15, column 12 to line 15, column 36 in card_nat_cross
    2. Line 15, column 33 to line 15, column 36 in card_nat_cross
    3. Line 12, column 9 to line 12, column 35 in card_nat_cross
    4. Line 12, column 9 to line 12, column 31 in card_nat_cross
---*)
