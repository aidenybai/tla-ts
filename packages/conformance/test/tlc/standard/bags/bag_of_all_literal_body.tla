(*---
description: 'An operator whose body is only a literal reaches BagOfAll as that value, because Spec.lookup returns the tool object of the body. Real TLC bug: F is rejected as not an operator, naming "k".'
ref: tlc2/tool/impl/Spec.java#lookup
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: evaluation-failure
correct:
  all:
    exit: 0
---*)
---- MODULE bag_of_all_literal_body ----
EXTENDS Bags, TLC, Naturals
F(x) == "k"
Test == BagOfAll(F, 1 :> 1) = ("k" :> 1)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_of_all_literal_body failed.
    2266:0 The first argument of BagOfAll should be an operator, but instead it is:
    "k"
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of BagOfAll should be an operator, but instead it is:
    "k"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in bag_of_all_literal_body
    1. Line 16, column 29 to line 16, column 32 in bag_of_all_literal_body
    2. Line 14, column 9 to line 14, column 40 in bag_of_all_literal_body
    3. Line 14, column 9 to line 14, column 27 in bag_of_all_literal_body
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of BagOfAll should be an operator, but instead it is:
    "k"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in bag_of_all_literal_body
    1. Line 17, column 30 to line 17, column 33 in bag_of_all_literal_body
    2. Line 14, column 9 to line 14, column 40 in bag_of_all_literal_body
    3. Line 14, column 9 to line 14, column 27 in bag_of_all_literal_body
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of BagOfAll should be an operator, but instead it is:
    "k"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in bag_of_all_literal_body
    1. Line 18, column 8 to line 18, column 32 in bag_of_all_literal_body
    2. Line 18, column 29 to line 18, column 32 in bag_of_all_literal_body
    3. Line 14, column 9 to line 14, column 40 in bag_of_all_literal_body
    4. Line 14, column 9 to line 14, column 27 in bag_of_all_literal_body
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of BagOfAll should be an operator, but instead it is:
    "k"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in bag_of_all_literal_body
    1. Line 17, column 12 to line 17, column 36 in bag_of_all_literal_body
    2. Line 17, column 33 to line 17, column 36 in bag_of_all_literal_body
    3. Line 14, column 9 to line 14, column 40 in bag_of_all_literal_body
    4. Line 14, column 9 to line 14, column 27 in bag_of_all_literal_body
---*)
