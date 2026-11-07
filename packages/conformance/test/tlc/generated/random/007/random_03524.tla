(*---
description: Evaluates a random set expression, seed 262, number 3524.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03524 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b5568 \in UNION {DOMAIN (1 :> 2), ({1} \cap 2..1)} : (\A b5569 \in UNION {SUBSET {1}, SUBSET {1}} : ([a |-> 1] = [a |-> 1]))} \cup {((1 % 3) * ([a |-> 1, b |-> TRUE]).a), LET b5570 == ([x \in 1..2 |-> x])[FALSE] IN (b5570 - <<>>)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03524 failed.
    Attempted to check if the value:
    FALSE
    is in the integer interval 1..2
---*)
