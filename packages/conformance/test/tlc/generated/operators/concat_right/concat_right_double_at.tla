(*---
description: concat_right applied to double_at, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o (1 :> 2) @@ (2 :> 3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<9, 2>>"
---*)
