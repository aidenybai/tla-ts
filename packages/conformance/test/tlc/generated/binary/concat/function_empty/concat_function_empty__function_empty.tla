(*---
description: concat of function_empty, a FcnRcdValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) \o ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
