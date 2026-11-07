(*---
description: "A function has no cardinality: FcnLambdaValue is not Enumerable."
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_of_lazy_function ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([x \in {1} |-> x]) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2181:0 Attempted to compute cardinality of the value
    <<1>>
init:
  exit: 75
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_of_lazy_function
    1. Line 14, column 29 to line 14, column 32 in card_of_lazy_function
    2. Line 12, column 9 to line 12, column 42 in card_of_lazy_function
    3. Line 12, column 9 to line 12, column 38 in card_of_lazy_function
next:
  exit: 255
  transcript: |-
    2181:1 Attempted to compute cardinality of the value
    <<1>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_of_lazy_function
    1. Line 15, column 30 to line 15, column 33 in card_of_lazy_function
    2. Line 12, column 9 to line 12, column 42 in card_of_lazy_function
    3. Line 12, column 9 to line 12, column 38 in card_of_lazy_function
invariant:
  exit: 75
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_of_lazy_function
    1. Line 16, column 8 to line 16, column 32 in card_of_lazy_function
    2. Line 16, column 29 to line 16, column 32 in card_of_lazy_function
    3. Line 12, column 9 to line 12, column 42 in card_of_lazy_function
    4. Line 12, column 9 to line 12, column 38 in card_of_lazy_function
property:
  exit: 75
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_of_lazy_function
    1. Line 15, column 12 to line 15, column 36 in card_of_lazy_function
    2. Line 15, column 33 to line 15, column 36 in card_of_lazy_function
    3. Line 12, column 9 to line 12, column 42 in card_of_lazy_function
    4. Line 12, column 9 to line 12, column 38 in card_of_lazy_function
---*)
