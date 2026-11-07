(*---
description: Evaluates a random bool expression, seed 262, number 173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Cardinality(({} \ 2..1)), Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))} \subseteq UNION {((SUBSET {1} \cap {x \in 1..3 : x > 1}) \ DOMAIN [x \in 1..2 |-> x]), {b278 \in (CHOOSE r \in [a : {2, 1, 3}] : TRUE) : (\E b279 \in SUBSET {1} : FALSE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00173 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
