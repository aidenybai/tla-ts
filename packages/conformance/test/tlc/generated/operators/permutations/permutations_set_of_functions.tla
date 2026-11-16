(*---
description: permutations applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(<<2>> :> <<2>> @@ <<3>> :> <<3>>), (<<2>> :> <<3>> @@ <<3>> :> <<2>>)}"
---*)
