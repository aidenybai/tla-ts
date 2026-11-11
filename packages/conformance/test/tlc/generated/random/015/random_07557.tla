(*---
description: Evaluates a random int expression, seed 262, number 7557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : 1..2] : TRUE)).a % (((7 * 0) \div (CHOOSE b11637 \in 1..3 : TRUE)) \div UNION {({2, 1, 3} \cup 1..3), (1..3 \cap 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07557 failed.
    Attempted to check if the value:
    1
    is an element of the integer 2
---*)
