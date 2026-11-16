(*---
description: Evaluates a random bool expression, seed 262, number 8945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b13879 \in SUBSET {1} : TRUE) :> (-0)) = UNION {{b13880 \in {x \in 1..3 : x > 1} : TRUE}, {1 : b13881 \in {x \in 1..3 : x > 1}}}) => ((Tail(<<1>>) = (1 :> (1 :> 2))) /\ ((CHOOSE b13882 \in {1, 2} : FALSE) < (1 % FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08945 failed.
    Attempted to check equality of the function ({} :> 0) with the value:
    {1, 2, 3}
---*)
