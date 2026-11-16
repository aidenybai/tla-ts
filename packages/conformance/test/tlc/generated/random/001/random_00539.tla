(*---
description: Evaluates a random function expression, seed 262, number 539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b912 \in (({2, 1, 3} \cup 1..3) \ ({1} \cap {x \in 1..3 : x > 1})) : (~(\A b913 \in 2..1 : TRUE))) :> (LET b914 == IF TRUE THEN 3 ELSE 7 IN (-1) \div ((2147483647 .. 3) \ (FALSE .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00539 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 121 of module random_00539
---*)
