(*---
description: RandomElement cannot pick from Any.
ref: tlc2/module/TLC.java#RandomElement
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE random_element_refuses ----
EXTENDS TLC
Test == RandomElement(Any) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module random_element_refuses failed.
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    ANY
init:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_element_refuses
    1. Line 14, column 29 to line 14, column 32 in random_element_refuses
    2. Line 12, column 9 to line 12, column 30 in random_element_refuses
    3. Line 12, column 9 to line 12, column 26 in random_element_refuses
next:
  exit: 255
  transcript: |-
    2176:1 Applying RandomElement to the following value,
    which is not a finite set:
    ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in random_element_refuses
    1. Line 15, column 30 to line 15, column 33 in random_element_refuses
    2. Line 12, column 9 to line 12, column 30 in random_element_refuses
    3. Line 12, column 9 to line 12, column 26 in random_element_refuses
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_element_refuses
    1. Line 16, column 8 to line 16, column 32 in random_element_refuses
    2. Line 16, column 29 to line 16, column 32 in random_element_refuses
    3. Line 12, column 9 to line 12, column 30 in random_element_refuses
    4. Line 12, column 9 to line 12, column 26 in random_element_refuses
property:
  exit: 75
  transcript: |-
    1000:1 
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_element_refuses
    1. Line 15, column 12 to line 15, column 36 in random_element_refuses
    2. Line 15, column 33 to line 15, column 36 in random_element_refuses
    3. Line 12, column 9 to line 12, column 30 in random_element_refuses
    4. Line 12, column 9 to line 12, column 26 in random_element_refuses
---*)
