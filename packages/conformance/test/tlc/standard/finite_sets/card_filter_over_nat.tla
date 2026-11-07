(*---
description: A filter over Nat cannot be enumerated even though it is finite.
ref: tlc2/value/impl/SetPredValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_filter_over_nat ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({n \in Nat : n < 3}) = 3
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_over_nat
    1. Line 14, column 29 to line 14, column 32 in card_filter_over_nat
    2. Line 12, column 9 to line 12, column 44 in card_filter_over_nat
    3. Line 12, column 9 to line 12, column 40 in card_filter_over_nat
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
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_filter_over_nat
    1. Line 15, column 30 to line 15, column 33 in card_filter_over_nat
    2. Line 12, column 9 to line 12, column 44 in card_filter_over_nat
    3. Line 12, column 9 to line 12, column 40 in card_filter_over_nat
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_over_nat
    1. Line 16, column 8 to line 16, column 32 in card_filter_over_nat
    2. Line 16, column 29 to line 16, column 32 in card_filter_over_nat
    3. Line 12, column 9 to line 12, column 44 in card_filter_over_nat
    4. Line 12, column 9 to line 12, column 40 in card_filter_over_nat
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_filter_over_nat
    1. Line 15, column 12 to line 15, column 36 in card_filter_over_nat
    2. Line 15, column 33 to line 15, column 36 in card_filter_over_nat
    3. Line 12, column 9 to line 12, column 44 in card_filter_over_nat
    4. Line 12, column 9 to line 12, column 40 in card_filter_over_nat
---*)
