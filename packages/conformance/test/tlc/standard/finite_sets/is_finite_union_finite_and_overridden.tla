(*---
description: A set holding {1} and Nat cannot be normalized, since an overridden value does not compare with a set, so isFinite never answers.
ref: tlc2/value/impl/UserValue.java#compareTo
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE is_finite_union_finite_and_overridden ----
EXTENDS FiniteSets, Naturals
Test == IsFiniteSet(UNION {{1}, Nat})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_union_finite_and_overridden
    1. Line 14, column 29 to line 14, column 32 in is_finite_union_finite_and_overridden
    2. Line 12, column 9 to line 12, column 37 in is_finite_union_finite_and_overridden
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in is_finite_union_finite_and_overridden
    1. Line 15, column 30 to line 15, column 33 in is_finite_union_finite_and_overridden
    2. Line 12, column 9 to line 12, column 37 in is_finite_union_finite_and_overridden
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_union_finite_and_overridden
    1. Line 16, column 8 to line 16, column 32 in is_finite_union_finite_and_overridden
    2. Line 16, column 29 to line 16, column 32 in is_finite_union_finite_and_overridden
    3. Line 12, column 9 to line 12, column 37 in is_finite_union_finite_and_overridden
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in is_finite_union_finite_and_overridden
    1. Line 15, column 12 to line 15, column 36 in is_finite_union_finite_and_overridden
    2. Line 15, column 33 to line 15, column 36 in is_finite_union_finite_and_overridden
    3. Line 12, column 9 to line 12, column 37 in is_finite_union_finite_and_overridden
---*)
