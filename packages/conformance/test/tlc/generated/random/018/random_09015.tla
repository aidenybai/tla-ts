(*---
description: Evaluates a random function expression, seed 262, number 9015.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b14004 \in UNION {IF FALSE THEN 3 ELSE -1, DOMAIN [x \in 1..2 |-> x]} : ((TRUE /\ FALSE) /\ (\A b14005 \in {x \in 1..3 : x > 1} : TRUE))) :> (IF (TRUE => FALSE) THEN (7 \div 2) ELSE LET b14006 == 3 IN 1 + ((-1 * 1) \div (CHOOSE f \in [{} -> {}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09015 failed.
    Attempted to compare the set {1, 2} with the value:
    -1
---*)
