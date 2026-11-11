(*---
description: Evaluates a random set expression, seed 262, number 6224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Append(<<3, 1, 2>>, -1) \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) EXCEPT !.a = @ + (-Cardinality({1}))] EXCEPT !.a = (([[x \in 1..2 |-> x] EXCEPT ![7] = 7])[(7 - 2147483647)] \div ((7 + 2) \div (1)[1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06224 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
