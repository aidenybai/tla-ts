(*---
description: Evaluates a random record expression, seed 262, number 5804.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05804 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(SelectSeq(<<>>, LAMBDA e : e > 0) \o Tail(<<1, 2>>)) EXCEPT !.a = ([b8949 \in {} |-> b8949])[Head(<<3, 1, 2>>)]] EXCEPT !.a = ([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05804 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
