(*---
description: Evaluates a random record expression, seed 262, number 2093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ([(7 :> [a |-> 1]) EXCEPT ![CASE FALSE -> 2147483647 [] OTHER -> 7] = IF FALSE THEN 3 ELSE 2147483647])[((3 - 0) % (3 + 2))], b |-> (([a |-> 2147483647, b |-> TRUE]).a \in {b3333 \in (2 .. 2147483647) : (TRUE /\ TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02093 failed.
    Attempted to apply function:
    (7 :> 2147483647)
    to argument 3, which is not in the domain of the function.
---*)
