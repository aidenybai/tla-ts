(*---
description: Evaluates a random record expression, seed 262, number 2244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF ((<<3, 1, 2>> \o <<>>) = [b3529 \in 2..1 |-> 2]) THEN ([a |-> 7, b |-> TRUE]).a ELSE (([a |-> 1]).a \div Cardinality(SUBSET {1})), b |-> (\E b3530 \in DOMAIN [b3531 \in 1..3 |-> -1] : (Tail(<<1, 2>>) = [<<5, 6>> EXCEPT ![b3530] = b3530]))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 229 to line 14, col 236 of module random_02244
    | [a |-> 0, b |-> FALSE]
---*)
