(*---
description: Evaluates a random set expression, seed 262, number 1790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Len(<<1>>) * Head(<<>>)), ((7 \div 3) + (CHOOSE b2835 \in 1..3 : FALSE))} \cup (UNION {{b2836 : b2836 \in {2, 1, 3}}, {7, <<>>}} \cap UNION {([a |-> 1, b |-> TRUE] \cup {2, 1, 3}), {b2837 \in {1, 2} : TRUE}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
