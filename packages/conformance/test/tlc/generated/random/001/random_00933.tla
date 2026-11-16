(*---
description: Evaluates a random record expression, seed 262, number 933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-[[x \in Nat |-> x + 1] EXCEPT ![2147483647] = -1]), b |-> ((<<3, 1, 2>> \o {x \in 1..3 : x > 1}) = (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))] EXCEPT !.a = @ + (Len(<<2, 1>>) \div Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00933 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
