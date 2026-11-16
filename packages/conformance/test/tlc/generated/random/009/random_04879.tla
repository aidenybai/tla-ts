(*---
description: Evaluates a random function expression, seed 262, number 4879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) EXCEPT ![Cardinality({IF FALSE THEN [x \in Nat |-> x + 1] ELSE [a |-> 1, b |-> TRUE], (0 + 3)})] = (-([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 7])[Cardinality(SUBSET {1})])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04879 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 62 of module random_04879
---*)
