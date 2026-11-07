(*---
description: merge of set_of_functions, a SetOfFcnsValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_of_functions__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) @@ (Nat))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
---*)
