(*---
description: Evaluates a random function expression, seed 262, number 7341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b11298 \in (DOMAIN [x \in 1..2 |-> x] = IF FALSE THEN 2 ELSE 0) : (SubSeq(<<1>>, b11298, b11298) = {3 : b11299 \in {1}})) :> (({7 : b11300 \in 1..3} \ {b11301 : b11301 \in Nat}) - LET b11302 == Len(<<1>>) IN (0 - <<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07341 failed.
    Attempted to check equality of the set {1, 2} with the value:
    0
---*)
