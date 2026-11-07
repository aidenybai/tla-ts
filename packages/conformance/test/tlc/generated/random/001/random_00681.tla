(*---
description: Evaluates a random set expression, seed 262, number 681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[<<5, 6>> EXCEPT ![<<3, 1, 2>>] = 2] EXCEPT ![Cardinality({x \in 1..3 : x > 1})] = Cardinality(Nat)] \cap {(CASE FALSE -> -1 [] OTHER -> 0 < (CHOOSE b1137 \in {1, 2} : [a |-> 1])), ((-2147483647) \div (2 % -1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00681 failed.
    Attempted to access tuple at a non integral index: <<3, 1, 2>>
---*)
