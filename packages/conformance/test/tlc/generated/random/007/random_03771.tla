(*---
description: Evaluates a random function expression, seed 262, number 3771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : 2..1] : TRUE)).a :> LET b5949 == LET b5950 == 1 IN 2147483647 IN Len(<<>>)) @@ [b5951 \in {(-1 \div b5952) : b5952 \in (1..3 \cap 1..3)} |-> (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03771 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_03771
---*)
