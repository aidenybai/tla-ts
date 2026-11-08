(*---
description: Evaluates a random bool expression, seed 262, number 1005.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01005 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (CASE FALSE -> 2 [] OTHER -> 1 \div IF FALSE THEN 0 ELSE 2147483647)] = (CASE (TRUE /\ TRUE) -> Cardinality(Nat) [] OTHER -> ([a |-> 1]).a \div IF (-1 \in {x \in 1..3 : x > 1}) THEN IF FALSE THEN 7 ELSE -1 ELSE (<<5, 6>>)[1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01005 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
