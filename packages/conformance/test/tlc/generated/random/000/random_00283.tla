(*---
description: Evaluates a random set expression, seed 262, number 283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Head(<<>>) + (7 + 2)), (CHOOSE b478 \in SortSeq(<<>>, LAMBDA p, q : p < q) : (TRUE <=> TRUE))} \cup {b479 \in ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) .. Head(<<1>>)) : (\A b480 \in (SUBSET {1} \cup 1..3) : (SUBSET {1} \subseteq {}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00283 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
