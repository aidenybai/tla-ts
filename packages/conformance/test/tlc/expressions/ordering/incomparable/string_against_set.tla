(*---
description: "A string and a set in one set cannot be sorted."
ref: "tlc2/value/impl/StringValue.java#compareTo"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE string_against_set ----
EXTENDS Integers, FiniteSets
Test == Cardinality({"a", {1}}) = 2
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module string_against_set failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_against_set
    1. Line 11, column 29 to line 11, column 32 in string_against_set
    2. Line 9, column 9 to line 9, column 35 in string_against_set
    3. Line 9, column 9 to line 9, column 31 in string_against_set
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
    Attempted to compare the set {1} with the value:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in string_against_set
    1. Line 12, column 30 to line 12, column 33 in string_against_set
    2. Line 9, column 9 to line 9, column 35 in string_against_set
    3. Line 9, column 9 to line 9, column 31 in string_against_set
invariant:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_against_set
    1. Line 13, column 8 to line 13, column 32 in string_against_set
    2. Line 13, column 29 to line 13, column 32 in string_against_set
    3. Line 9, column 9 to line 9, column 35 in string_against_set
    4. Line 9, column 9 to line 9, column 31 in string_against_set
property:
  exit: 75
  transcript: |-
    2102:1 While working on the initial state:
    conformance_state = TRUE
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {1} with the value:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in string_against_set
    1. Line 12, column 12 to line 12, column 36 in string_against_set
    2. Line 12, column 33 to line 12, column 36 in string_against_set
    3. Line 9, column 9 to line 9, column 35 in string_against_set
    4. Line 9, column 9 to line 9, column 31 in string_against_set
---*)
