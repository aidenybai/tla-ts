(*---
description: Evaluates a random bool expression, seed 262, number 239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b395 \in Head(Tail(<<1>>)) : ((2147483647 \subseteq {1, 2}) <=> ({x \in 1..3 : x > 1} \subseteq {1}))} = ({(CHOOSE b397 \in SUBSET {1} : FALSE) : b396 \in DOMAIN (1 :> 2)} \ (UNION {2..1, {1, 2}} \cup {7 : b398 \in {}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00239 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
