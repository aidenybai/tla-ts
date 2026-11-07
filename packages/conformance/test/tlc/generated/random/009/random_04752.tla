(*---
description: Evaluates a random int expression, seed 262, number 4752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7416 == (CHOOSE b7417 \in (DOMAIN [x \in 1..2 |-> x] \cup (SUBSET {1} \cup {})) : ((FALSE /\ FALSE) /\ (\A b7418 \in {2, 1, 3} : FALSE))) IN LET b7419 == (CASE FALSE -> 2147483647 [] OTHER -> b7416 % SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) IN ((b7419 :> b7419))[Head(<<1>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04752 failed.
    Attempted to compare the set {} with the value:
    2
---*)
