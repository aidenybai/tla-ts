(*---
description: Evaluates a random function expression, seed 262, number 3259.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03259 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b5188 \in ({b5189 : b5189 \in {2, 1, 3}} \cap (1..3 \ SUBSET {1})) |-> (Len(<<1, 2>>) + (-1))] @@ ((CHOOSE f \in [{1} -> 2..1] : TRUE) @@ [b5190 \in (-1 .. 0) |-> CASE TRUE -> 2147483647 [] OTHER -> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03259 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
