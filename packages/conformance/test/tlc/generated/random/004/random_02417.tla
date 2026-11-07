(*---
description: Evaluates a random set expression, seed 262, number 2417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Len(<<1, 2>>) : b3814 \in UNION {{1, 2}, {x \in 1..3 : x > 1}}} \cap {Head(<<>>), (CHOOSE b3815 \in 1..3 : FALSE)}) \ {([[a |-> 1] EXCEPT !.a = 2]).a, (CHOOSE b3816 \in {2 : b3817 \in {1}} : (\A b3818 \in {} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
