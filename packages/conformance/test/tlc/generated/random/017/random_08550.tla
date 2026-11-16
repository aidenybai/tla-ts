(*---
description: Evaluates a random set expression, seed 262, number 8550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13252 \in (({b13253 \in {1, 2} : FALSE} \cap (3 \cap {1})) \cap ((0 \div 2) .. [[x \in Nat |-> x + 1] EXCEPT ![1] = 1..3])) : ((([x \in Nat |-> x + 1])[b13252] \div ([x \in 1..2 |-> x])[b13252]) = ((CHOOSE r \in [a : {}] : TRUE)).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08550 failed.
    Attempted to check if the value:
    1
    is an element of the integer 3
---*)
