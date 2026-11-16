(*---
description: Evaluates a random function expression, seed 262, number 4114.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04114 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b6463 \in ((2..1 \cup 1..3) \cap UNION {{1, 2}, {x \in 1..3 : x > 1}}) |-> ((b6463 + b6463) \div ([a |-> 1]).a)] EXCEPT ![(((CHOOSE r \in [a : 2..1] : TRUE)).a * (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(3 * {x \in 1..3 : x > 1})])] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = (\E b6464 \in Nat : TRUE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04114 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 143 to line 14, col 172 of module random_04114
---*)
