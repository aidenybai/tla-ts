(*---
description: Evaluates a random record expression, seed 262, number 4121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + ((CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE))[(CHOOSE b6475 \in {1, 2} : FALSE)]] EXCEPT !.a = [b6476 \in {(2147483647 + 2147483647), (7 \div [a |-> 1, b |-> TRUE])} |-> Head(SelectSeq(b6476, LAMBDA e : e > 0))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04121 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 124 to line 14, col 154 of module random_04121
---*)
