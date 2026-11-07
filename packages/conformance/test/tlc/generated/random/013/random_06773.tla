(*---
description: Evaluates a random record expression, seed 262, number 6773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [b10384 \in UNION {2..1, {}} |-> ([a |-> 1, b |-> TRUE]).a], b |-> ((2 * 2) = IF TRUE THEN 1 ELSE 3)] EXCEPT !.a = (((2 :> 2))[((1 :> 2))[2]] \div (CHOOSE b10385 \in (2147483647 .. 1) : ({} = SUBSET {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06773 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
