(*---
description: Evaluates a random set expression, seed 262, number 7076.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07076 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {(DOMAIN [x \in 1..2 |-> x] \ {b10869 : b10869 \in {}}), ({-1, 0} \ (SUBSET {1} \cup {}))} \ ({(b10870 \div 0) : b10870 \in (SUBSET {1} \cup Nat)} \cup {(2 \div 2147483647) : b10871 \in (2 .. 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07076 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
