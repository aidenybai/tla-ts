(*---
description: concat of set_cap, a SetCapValue, and int_one, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_set_cap__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \o (1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_set_cap__int_one failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {2}
---*)
