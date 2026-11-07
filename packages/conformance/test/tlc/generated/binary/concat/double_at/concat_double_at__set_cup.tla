(*---
description: concat of double_at, a FcnRcdValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_double_at__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) \o ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1, 2}
---*)
