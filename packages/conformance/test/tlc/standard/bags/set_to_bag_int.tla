(*---
description: "SetToBag's argument error is worded as BagToSet: a copy-paste slip in the source's message."
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE set_to_bag_int ----
EXTENDS Bags, TLC, Naturals
Test == SetToBag(3) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
init:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_int
    1. Line 14, column 29 to line 14, column 32 in set_to_bag_int
    2. Line 12, column 9 to line 12, column 30 in set_to_bag_int
    3. Line 12, column 9 to line 12, column 19 in set_to_bag_int
next:
  exit: 255
  transcript: |-
    2176:1 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in set_to_bag_int
    1. Line 15, column 30 to line 15, column 33 in set_to_bag_int
    2. Line 12, column 9 to line 12, column 30 in set_to_bag_int
    3. Line 12, column 9 to line 12, column 19 in set_to_bag_int
invariant:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_int
    1. Line 16, column 8 to line 16, column 32 in set_to_bag_int
    2. Line 16, column 29 to line 16, column 32 in set_to_bag_int
    3. Line 12, column 9 to line 12, column 30 in set_to_bag_int
    4. Line 12, column 9 to line 12, column 19 in set_to_bag_int
property:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_int
    1. Line 15, column 12 to line 15, column 36 in set_to_bag_int
    2. Line 15, column 33 to line 15, column 36 in set_to_bag_int
    3. Line 12, column 9 to line 12, column 30 in set_to_bag_int
    4. Line 12, column 9 to line 12, column 19 in set_to_bag_int
---*)
