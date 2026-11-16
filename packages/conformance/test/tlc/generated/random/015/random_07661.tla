(*---
description: Evaluates a random int expression, seed 262, number 7661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11790 \in ({Cardinality(SUBSET {1}), ((1 :> 2))[0]} \ (UNION {{1}, 1..3} \ DOMAIN (1 :> 2))) : ({LET b11792 == b11791 IN -1 : b11791 \in (b11790 .. 1)} = ({b11793 : b11793 \in SUBSET {1}} \cup UNION {{1}, {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07661 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
