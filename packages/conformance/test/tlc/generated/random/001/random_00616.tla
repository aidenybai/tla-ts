(*---
description: Evaluates a random set expression, seed 262, number 616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{b1034 \in {3, 2} : ({1, 2} \subseteq SUBSET {1})}, LET b1035 == ([a |-> 1, b |-> TRUE]).a IN (7 * 2147483647)} \ ([a |-> (1 + [a |-> 1, b |-> TRUE]), b |-> (7 = -1)] \ ((7 - 2147483647) .. (2147483647 * 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00616 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
