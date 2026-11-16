(*---
description: Evaluates a random int expression, seed 262, number 2777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4386 \in ((1 - 2) .. ([x \in 1..2 |-> x])[3]) : ((b4386 \in {x \in 1..3 : x > 1}) \/ ([a |-> 1, b |-> TRUE] = [a |-> 1]))) \div CASE (({1} \cup 1..3) \subseteq DOMAIN <<5, 6>>) -> ((1 + 1) % (3 * 2147483647)) [] OTHER -> IF (3 = 1) THEN (CHOOSE b4387 \in 2..1 : FALSE) ELSE IF FALSE THEN 2147483647 ELSE 2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02777 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
