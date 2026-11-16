(*---
description: Evaluates a random int expression, seed 262, number 2236.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02236 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((UNION {{x \in 1..3 : x > 1}, 2..1} \ [b3513 \in 1..3 |-> b3513]) = {b3514 \in {1 : b3515 \in SUBSET {1}} : (-1 \div 2)}) THEN LET b3516 == Cardinality(({2, 1, 3} \ 2..1)) IN ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a ELSE (Len((<<3, 1, 2>> \o <<1, 2>>)) \div ((-1 - 7) * (2147483647 - 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02236 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was an integer.
    line 14, col 129 to line 14, col 137 of module random_02236
---*)
