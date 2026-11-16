(*---
description: Evaluates a random function expression, seed 262, number 6313.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06313 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9705 \in ((({1, 2} \ {1, 2}) \ {2, {2, 1, 3}}) \cap ({7, -1} \ (Nat \cap SUBSET {1}))) |-> CASE (Head(<<1>>) < (1 + b9705)) -> ([(1 :> 2) EXCEPT ![b9705] = b9705])[([a |-> 1, b |-> TRUE]).a] [] OTHER -> ((b9705 % 7) \div ([x \in Nat |-> x + 1] % [x \in Nat |-> x + 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06313 failed.
    Attempted to check if the non-enumerable value
    7
    is element of
    {{}, {1}}
---*)
