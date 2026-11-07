(*---
description: SetToBag of Nat cannot enumerate it, and also words the error as BagToSet.
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE set_to_bag_nat ----
EXTENDS Bags, TLC, Naturals
Test == SetToBag(Nat) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
init:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_nat
    1. Line 14, column 29 to line 14, column 32 in set_to_bag_nat
    2. Line 12, column 9 to line 12, column 32 in set_to_bag_nat
    3. Line 12, column 9 to line 12, column 21 in set_to_bag_nat
next:
  exit: 255
  transcript: |-
    2176:1 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in set_to_bag_nat
    1. Line 15, column 30 to line 15, column 33 in set_to_bag_nat
    2. Line 12, column 9 to line 12, column 32 in set_to_bag_nat
    3. Line 12, column 9 to line 12, column 21 in set_to_bag_nat
invariant:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_nat
    1. Line 16, column 8 to line 16, column 32 in set_to_bag_nat
    2. Line 16, column 29 to line 16, column 32 in set_to_bag_nat
    3. Line 12, column 9 to line 12, column 32 in set_to_bag_nat
    4. Line 12, column 9 to line 12, column 21 in set_to_bag_nat
property:
  exit: 75
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_to_bag_nat
    1. Line 15, column 12 to line 15, column 36 in set_to_bag_nat
    2. Line 15, column 33 to line 15, column 36 in set_to_bag_nat
    3. Line 12, column 9 to line 12, column 32 in set_to_bag_nat
    4. Line 12, column 9 to line 12, column 21 in set_to_bag_nat
---*)
