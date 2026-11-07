(*---
description: Evaluates a random record expression, seed 262, number 1217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (1 \div 1)]).a, b |-> ((\E b1953 \in SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) : (~TRUE)) \/ (~(\E b1954 \in {1, 2} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01217 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2, 3>>.
    line 14, col 117 to line 14, col 157 of module random_01217
---*)
