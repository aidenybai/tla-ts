(*---
description: Evaluates a random bool expression, seed 262, number 6675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (CASE FALSE -> 2147483647 [] OTHER -> 3 \in (SUBSET {1} \cap {2, 1, 3})) -> CASE (TRUE => FALSE) -> (3 \div 2147483647) [] OTHER -> Cardinality(2..1) [] OTHER -> ((-2) + LET b10233 == -1 IN b10233) \in ({Len(<<1, 2>>), (2 + 7)} \cap {b10234 \in (2..1 \cup {x \in 1..3 : x > 1}) : (7 + b10234)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06675 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
