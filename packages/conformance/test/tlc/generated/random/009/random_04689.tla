(*---
description: Evaluates a random function expression, seed 262, number 4689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7329 \in (({<<1>>, 2147483647} \cup UNION {{}, {1}}) \cap (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) |-> ((([x \in 1..2 |-> x])[b7329] \div Len(<<1>>)) + Cardinality({2147483647 : b7330 \in 2..1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04689 failed.
    Attempted to check equality of the function <<1>> with the value:
    1
---*)
