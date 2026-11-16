(*---
description: Evaluates a random set expression, seed 262, number 7715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((Append(<<1, 2>>, 1) \o Append([a |-> 1, b |-> TRUE], b11902)) \div ((CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))[([a |-> 1]).a]) : b11902 \in DOMAIN ((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE) @@ SortSeq(<<>>, LAMBDA p, q : p < q))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07715 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1, b |-> TRUE]
---*)
