(*---
description: concat_left applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_left_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {} |-> x] \o <<9>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9>>"
---*)
