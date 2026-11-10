(*---
description: permutations applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { ([a |-> 1] :> [a |-> 1] @@ [a |-> 2] :> [a |-> 2]),
    |   ([a |-> 1] :> [a |-> 2] @@ [a |-> 2] :> [a |-> 1]) }
---*)
