(*---
description: permutations applied to tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(<<>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<>>
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<>>
---*)
