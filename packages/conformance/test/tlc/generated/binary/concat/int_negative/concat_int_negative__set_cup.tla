(*---
description: concat of int_negative, a IntValue, and set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_negative__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \o ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_int_negative__set_cup failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -3
---*)
