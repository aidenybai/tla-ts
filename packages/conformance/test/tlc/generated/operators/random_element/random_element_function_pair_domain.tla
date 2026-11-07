(*---
description: random_element applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    (<<1, 2>> :> 3)
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    (<<1, 2>> :> 3)
---*)
