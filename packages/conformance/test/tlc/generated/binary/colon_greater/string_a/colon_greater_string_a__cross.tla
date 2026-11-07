(*---
description: colon_greater of string_a, a StringValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> {<<1, 3>>, <<2, 3>>}]"
---*)
