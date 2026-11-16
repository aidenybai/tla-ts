(*---
description: Evaluates a random set expression, seed 262, number 3866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b6090 \in {b6091 \in {1} : TRUE} |-> CASE FALSE -> 0 [] OTHER -> b6090] EXCEPT ![([a |-> -1, b |-> TRUE]).a] = ((CHOOSE b6092 \in Nat : TRUE) * (1 \in 2..1))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 95 of module random_03866
    | {1}
---*)
