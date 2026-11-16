(*---
description: Evaluates a random int expression, seed 262, number 1009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(CHOOSE b1622 \in SubSeq(<<3, 1, 2>>, 2147483647, 0) : ({1, 2} \cap 2..1)) : b1621 \in (<<2, 2147483647>> \o SubSeq(<<3, 1, 2>>, 7, -1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01009 failed.
    TLC encountered a non-enumerable quantifier bound
    <<2, 2147483647>>.
    line 14, col 117 to line 14, col 163 of module random_01009
---*)
