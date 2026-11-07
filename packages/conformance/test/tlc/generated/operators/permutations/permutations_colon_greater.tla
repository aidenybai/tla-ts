(*---
description: permutations applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(1 :> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<2>>
    2176:0 Applying Permutations to the following value,
    which is not a finite set:
    <<2>>
---*)
