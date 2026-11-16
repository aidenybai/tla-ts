(*---
description: Evaluates a random bool expression, seed 262, number 566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b958 \in ({b959 \in ({1, 2} \cup {1, 2}) : (b959 = b959)} \cup DOMAIN (<<5, 6>> @@ [x \in 1..2 |-> x])) : (((<<1>> = [x \in Nat |-> x + 1]) <=> (FALSE <=> TRUE)) <=> (\A b960 \in ({} \cap Nat) : (TRUE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00566 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
