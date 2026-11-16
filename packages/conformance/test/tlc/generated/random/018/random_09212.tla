(*---
description: Evaluates a random function expression, seed 262, number 9212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-Len(<<1, 2>>)), b |-> ([{} EXCEPT !.a = -1] <=> (FALSE \/ TRUE))] EXCEPT !.a = @ + ((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE) \div CASE (TRUE /\ TRUE) -> (CHOOSE b14298 \in 1..3 : TRUE) [] OTHER -> ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09212 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
