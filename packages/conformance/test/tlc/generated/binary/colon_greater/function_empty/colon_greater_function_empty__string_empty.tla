(*---
description: colon_greater of function_empty, a FcnRcdValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<>> :> "")'
---*)
