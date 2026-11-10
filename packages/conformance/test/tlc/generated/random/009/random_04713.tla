(*---
description: Evaluates a random int expression, seed 262, number 4713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = (((1 :> 2) @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))) THEN (Cardinality(({1, 2} \cap {1, 2})) % ((-3) + IF TRUE THEN 7 ELSE 1)) ELSE (([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 1])[(7 \div 2147483647)] \div Cardinality(UNION {Nat, 1..3})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04713 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 98 to line 14, col 136 of module random_04713
---*)
