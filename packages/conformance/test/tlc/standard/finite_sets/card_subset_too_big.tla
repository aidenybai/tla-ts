(*---
description: SUBSET of a 31-element set exceeds the integer range.
ref: tlc2/value/impl/SubsetValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_subset_too_big ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(SUBSET (1..31)) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module card_subset_too_big failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..31)
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..31)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_subset_too_big
    1. Line 14, column 29 to line 14, column 32 in card_subset_too_big
    2. Line 12, column 9 to line 12, column 39 in card_subset_too_big
    3. Line 12, column 9 to line 12, column 35 in card_subset_too_big
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
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..31)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_subset_too_big
    1. Line 15, column 30 to line 15, column 33 in card_subset_too_big
    2. Line 12, column 9 to line 12, column 39 in card_subset_too_big
    3. Line 12, column 9 to line 12, column 35 in card_subset_too_big
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..31)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_subset_too_big
    1. Line 16, column 8 to line 16, column 32 in card_subset_too_big
    2. Line 16, column 29 to line 16, column 32 in card_subset_too_big
    3. Line 12, column 9 to line 12, column 39 in card_subset_too_big
    4. Line 12, column 9 to line 12, column 35 in card_subset_too_big
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    2178:0 Overflow when computing the number of elements in:
    SUBSET (1..31)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_subset_too_big
    1. Line 15, column 12 to line 15, column 36 in card_subset_too_big
    2. Line 15, column 33 to line 15, column 36 in card_subset_too_big
    3. Line 12, column 9 to line 12, column 39 in card_subset_too_big
    4. Line 12, column 9 to line 12, column 35 in card_subset_too_big
---*)
