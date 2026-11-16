(*---
description: Evaluates a random function expression, seed 262, number 3861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b6081 \in {(2 * b6082) : b6082 \in UNION {{x \in 1..3 : x > 1}, SUBSET {1}}} |-> Cardinality((2..1 \cup [x \in 1..2 |-> x]))] EXCEPT ![Cardinality({b6083 \in UNION {{1}, 2..1} : (<<1, 2>> \in {x \in 1..3 : x > 1})})] = (CHOOSE b6084 \in {b6085 \in {2147483647, 2} : ([a |-> 1, b |-> TRUE] = [a |-> 1])} : (~({2, 1, 3} = SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03861 failed.
    Attempted to compare the set {} with the value:
    2
---*)
