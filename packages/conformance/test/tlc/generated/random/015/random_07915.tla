(*---
description: Evaluates a random function expression, seed 262, number 7915.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07915 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {}] : TRUE) EXCEPT ![IF ((FALSE <=> FALSE) <=> (1 = 2147483647)) THEN Cardinality((SUBSET {1} \ {2, 1, 3})) ELSE IF (7 <=> TRUE) THEN IF FALSE THEN 2147483647 ELSE 0 ELSE (<<5, 6>>)[1]] = LET b12213 == ([<<5, 6>> EXCEPT ![2] = 7])[([x \in Nat |-> x + 1])[2147483647]] IN ((2 % b12213) % (CHOOSE b12214 \in {1} : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07915 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_07915
---*)
