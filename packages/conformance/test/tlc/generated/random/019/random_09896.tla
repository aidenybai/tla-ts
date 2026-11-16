(*---
description: Evaluates a random record expression, seed 262, number 9896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a * (-2147483647))] EXCEPT !.a = @ + (CHOOSE b15390 \in ({<<1>>, 7} \cup (7 .. 7)) : ([[a |-> 1] EXCEPT !.a = b15390] = [b15390 EXCEPT !.a = @ + b15390]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09896 failed.
    Attempted to check equality of the function <<1>> with the value:
    7
---*)
