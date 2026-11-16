(*---
description: permutations applied to cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { (<<1, 3>> :> <<1, 3>> @@ <<2, 3>> :> <<2, 3>>),
    |   (<<1, 3>> :> <<2, 3>> @@ <<2, 3>> :> <<1, 3>>) }
---*)
