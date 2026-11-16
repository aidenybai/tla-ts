(*---
description: Evaluates a random set expression, seed 262, number 9298.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09298 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b14428 \in ({b14427, b14427} \cup ({2, 1, 3} \cup {})) : ([SUBSET {1} EXCEPT ![1] = 2] = (2147483647 :> 0))) : b14427 \in ((LET b14429 == 3 IN b14429 .. ([a |-> 1]).a) \cup (({1} \cup {1}) \cup ({2, 1, 3} \cup 2..1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09298 failed.
    Attempted to apply EXCEPT construct to the value {{}, {1}}.
---*)
