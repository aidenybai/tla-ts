(*---
description: Evaluates a random bool expression, seed 262, number 550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b934 \in {x \in 1..3 : x > 1} : TRUE} \cup DOMAIN [x \in 1..2 |-> x]) = (UNION {(1 :> 2), 1..3} \cap (SUBSET {1} \cap {1}))) /\ (\A b935 \in ((3 .. [a |-> 1, b |-> TRUE]) \cup {7 : b936 \in 2..1}) : (([a |-> 1, b |-> TRUE]).a \in DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00550 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
