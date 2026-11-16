(*---
description: Evaluates a random function expression, seed 262, number 2295.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02295 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3621 \in ({(\A b3622 \in {} : FALSE), Len(<<1>>)} \cup {b3623 \in {b3624 \in {} : FALSE} : (2 \in {1, 2})}) |-> (LET b3625 == IF FALSE THEN 2 ELSE 0 IN ([a |-> 1, b |-> TRUE] = [a |-> 1]) \div (CHOOSE b3626 \in {-1, 3} : ([x \in 1..2 |-> x])[b3626]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02295 failed.
    Attempted to compare integer 1 with non-integer:
    TRUE
---*)
