(*---
description: Evaluates a random int expression, seed 262, number 902.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00902 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\A b1451 \in {1 : b1452 \in SUBSET {1}} : ({} = {2, 1, 3})) THEN ([<<5, 6>> EXCEPT ![2] = 2])[CASE TRUE -> -1 [] OTHER -> 3] ELSE Len(Append(<<>>, 2)) - Cardinality((Head(<<>>) .. Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00902 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
