(*---
description: permutations applied to int_one, a IntValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    1
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    1
---*)
