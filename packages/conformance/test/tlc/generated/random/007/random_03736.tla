(*---
description: Evaluates a random int expression, seed 262, number 3736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 1, b |-> FALSE] EXCEPT !.a = @ + ((1 :> 2))[0]] \div ((2147483647 \div 2) % IF TRUE THEN 0 ELSE 1)) % <<Cardinality((SUBSET {1} \ {1, 2})), (CHOOSE b5901 \in (0 .. 7) : (~TRUE))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03736 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
