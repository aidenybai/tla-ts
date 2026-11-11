(*---
description: Evaluates a random set expression, seed 262, number 9009.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09009 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b13994 \in UNION {Nat, {1, 2}} |-> IF FALSE THEN b13994 ELSE -1] EXCEPT ![(((1 :> 2))[-1] - (CHOOSE b13995 \in {1, 2} : FALSE))] = (([a |-> 1, b |-> TRUE]).a % (2 - 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09009 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
