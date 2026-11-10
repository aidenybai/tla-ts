(*---
description: Evaluates a random function expression, seed 262, number 2712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4287 \in ({b4288 \in {0, 7} : (TRUE /\ FALSE)} \cap {(CHOOSE b4290 \in {} : TRUE) : b4289 \in UNION {{x \in 1..3 : x > 1}, {1, 2}}}) |-> IF (({x \in 1..3 : x > 1} \ {2, 1, 3}) = (<<5, 6>> @@ [a |-> 1])) THEN (CASE TRUE -> b4287 [] OTHER -> 2147483647 \div Head(<<1>>)) ELSE IF ({1, 2} \subseteq 1..3) THEN (-1 \div 0) ELSE (-3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02712 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 72 to line 14, col 97 of module random_02712
---*)
