(*---
description: Evaluates a random record expression, seed 262, number 123.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00123 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((<<5, 6>> @@ <<5, 6>>) + (2147483647 - -1)), b |-> (\A b191 \in {7, 3} : ([a |-> 1, b |-> TRUE] < 2))] EXCEPT !.a = @ + CASE (<<1, 1>> = [[x \in 1..2 |-> x] EXCEPT ![0] = 2]) -> ((CHOOSE b192 \in {} : TRUE) * Head(<<1, 2>>)) [] OTHER -> IF ({} \subseteq [x \in 1..2 |-> x]) THEN Len(<<1, 2>>) ELSE [SUBSET {1} EXCEPT ![1] = 3]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00123 failed.
    2178:0 Overflow when computing 2147483647--1
---*)
