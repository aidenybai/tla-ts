(*---
description: set_to_bag applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module set_to_bag_function_lazy>]
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module set_to_bag_function_lazy>]
---*)
