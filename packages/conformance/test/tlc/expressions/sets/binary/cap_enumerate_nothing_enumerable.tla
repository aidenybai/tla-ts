(*---
description: "Enumerating \\cap of two non-enumerable sets is an error."
ref: "tlc2/value/impl/SetCapValue.java#Enumerator"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE cap_enumerate_nothing_enumerable ----
EXTENDS Integers, FiniteSets
Test == Cardinality(Nat \cap Int) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
init:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in cap_enumerate_nothing_enumerable
    1. Line 11, column 29 to line 11, column 32 in cap_enumerate_nothing_enumerable
    2. Line 9, column 9 to line 9, column 37 in cap_enumerate_nothing_enumerable
    3. Line 9, column 9 to line 9, column 33 in cap_enumerate_nothing_enumerable
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
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2154:0 @!@!@
    Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in cap_enumerate_nothing_enumerable
    1. Line 12, column 30 to line 12, column 33 in cap_enumerate_nothing_enumerable
    2. Line 9, column 9 to line 9, column 37 in cap_enumerate_nothing_enumerable
    3. Line 9, column 9 to line 9, column 33 in cap_enumerate_nothing_enumerable
invariant:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in cap_enumerate_nothing_enumerable
    1. Line 13, column 8 to line 13, column 32 in cap_enumerate_nothing_enumerable
    2. Line 13, column 29 to line 13, column 32 in cap_enumerate_nothing_enumerable
    3. Line 9, column 9 to line 9, column 37 in cap_enumerate_nothing_enumerable
    4. Line 9, column 9 to line 9, column 33 in cap_enumerate_nothing_enumerable
property:
  exit: 75
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    | While working on the initial state:
    | conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cap T when neither S:
    Nat
    nor T:
    Int
    is enumerable
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in cap_enumerate_nothing_enumerable
    1. Line 12, column 12 to line 12, column 36 in cap_enumerate_nothing_enumerable
    2. Line 12, column 33 to line 12, column 36 in cap_enumerate_nothing_enumerable
    3. Line 9, column 9 to line 9, column 37 in cap_enumerate_nothing_enumerable
    4. Line 9, column 9 to line 9, column 33 in cap_enumerate_nothing_enumerable
---*)
