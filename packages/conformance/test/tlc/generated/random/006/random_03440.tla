(*---
description: Evaluates a random int expression, seed 262, number 3440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((SUBSET {1} \cap {x \in 1..3 : x > 1}) \cap {3 : b5452 \in 2..1}) \subseteq {IF TRUE THEN 7 ELSE 2147483647, CASE FALSE -> 3 [] OTHER -> 2147483647}) THEN ((LET b5453 == 2147483647 IN 7 * Len(<<>>)) % ([b5454 \in 3 |-> b5454])[CASE FALSE -> {1} [] OTHER -> -1]) ELSE (IF (~TRUE) THEN (3 \in 1..3) ELSE (-1 % 2) * Head([<<1>> EXCEPT ![1] = -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03440 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
