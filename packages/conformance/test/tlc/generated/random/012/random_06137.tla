(*---
description: Evaluates a random record expression, seed 262, number 6137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CASE FALSE -> 7 [] OTHER -> 2147483647 :> (-1 % 1)))[((-1) + IF TRUE THEN 0 ELSE 2147483647)], b |-> (((TRUE <=> FALSE) /\ (\A b9434 \in Nat : TRUE)) /\ ((2..1 \cap 2..1) = ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06137 failed.
    Attempted to apply function:
    (2147483647 :> 0)
    to argument -1, which is not in the domain of the function.
---*)
