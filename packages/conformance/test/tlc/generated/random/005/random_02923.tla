(*---
description: Evaluates a random set expression, seed 262, number 2923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(7 % 2) : b4619 \in (1..3 \cap {2, 1, 3})}, UNION {{2147483647, 0}, {7 : b4620 \in {1, 2}}}} \cup (([b4621 \in SUBSET {1} |-> TRUE])[Cardinality({x \in 1..3 : x > 1})] .. (CHOOSE b4622 \in {2147483647 : b4623 \in {1, 2}} : (\A b4624 \in SUBSET {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02923 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
