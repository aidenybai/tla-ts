(*---
description: Evaluates a random set expression, seed 262, number 322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE TRUE -> [a |-> 1, b |-> TRUE] [] OTHER -> b537 : b537 \in UNION {{1}, SUBSET {1}}} \cup UNION {({1, 2} \cap {1}), {b538 \in {x \in 1..3 : x > 1} : TRUE}}) \cup {((2147483647 - b539) - (CHOOSE b540 \in SUBSET {1} : FALSE)) : b539 \in ((1..3 \cup {1, 2}) \cap {2147483647, 3})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00322 failed.
    Attempted to compare the set {} with the value:
    1
---*)
