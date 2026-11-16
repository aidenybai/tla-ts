(*---
description: Evaluates a random set expression, seed 262, number 9697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({IF {x \in 1..3 : x > 1} THEN 1 ELSE 2147483647, ([a |-> 1]).a}) .. ([b15044 \in [[x \in Nat |-> x + 1] EXCEPT ![0] = 0] |-> (CHOOSE b15045 \in {x \in 1..3 : x > 1} : FALSE)])[(Cardinality(Nat) % Cardinality(SUBSET {1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09697 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as the condition of an IF.
    line 14, col 30 to line 14, col 75 of module random_09697
---*)
