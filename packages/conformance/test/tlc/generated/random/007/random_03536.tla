(*---
description: Evaluates a random int expression, seed 262, number 3536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5588 \in {(LET b5590 == b5589 IN 3 * (2 \div b5589)) : b5589 \in [[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = (0 * 1)]} : (UNION {DOMAIN (1 :> 2), ({2, 1, 3} \cap Nat)} = {(b5588 - 3), ((1 :> 2))[FALSE]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03536 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 0].
    line 14, col 90 to line 14, col 147 of module random_03536
---*)
