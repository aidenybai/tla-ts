(*---
description: Evaluates a random set expression, seed 262, number 5379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[(1 :> 2) EXCEPT ![7] = b8315] EXCEPT ![(-b8315)] = (CHOOSE b8316 \in {1} : FALSE)])[((7 \div b8315) + (<<1, 2>> = [x \in Nat |-> x + 1]))] : b8315 \in (((2 .. 3) \ ({} \cap {})) \ (({1, 2} \cap SUBSET {1}) \cup DOMAIN (1 :> 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05379 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
