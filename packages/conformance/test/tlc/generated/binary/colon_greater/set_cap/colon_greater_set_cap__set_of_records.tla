(*---
description: colon_greater of set_cap, a SetCapValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cap__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) :> ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> {[a |-> 1], [a |-> 2]})"
---*)
