(*---
description: Evaluates a random set expression, seed 262, number 286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a .. Len(<<3, 1, 2>>)) \ ({-1 : b484 \in <<1>>} \ {1, 2})) \cap ((IF FALSE THEN 0 ELSE 2 .. (3 + {1, 2})) \cap (DOMAIN (1 :> 2) \cap {2 : b485 \in SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00286 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 84 to line 14, col 88 of module random_00286
---*)
