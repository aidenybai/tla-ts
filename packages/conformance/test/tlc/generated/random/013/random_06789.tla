(*---
description: Evaluates a random bool expression, seed 262, number 6789.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06789 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b10410 \in ((-1 .. 7) \ UNION {SUBSET {1}, 2..1}) : ((\A b10411 \in SUBSET {1} : TRUE) \/ (FALSE => FALSE))) /\ (\A b10412 \in {Cardinality(2..1), Len(<<3, 1, 2>>)} : (\A b10413 \in {b10412 : b10414 \in {1}} : (b10412 \in 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06789 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
