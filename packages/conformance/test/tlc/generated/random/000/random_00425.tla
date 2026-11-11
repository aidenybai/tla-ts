(*---
description: Evaluates a random int expression, seed 262, number 425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b690 \in (UNION {{1, 2}, {1, 2}} \cap (2 .. 1)) |-> (<<b690, 3>> - (b690 \div b690))])[(CHOOSE b691 \in ({b692 : b692 \in 1..3} \ ({1} \cup SUBSET {1})) : (\E b693 \in (2147483647 .. b691) : (SUBSET {1} <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00425 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
