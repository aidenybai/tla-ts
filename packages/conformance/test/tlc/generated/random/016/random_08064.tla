(*---
description: Evaluates a random bool expression, seed 262, number 8064.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08064 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12460 \in {b12461 \in (-1 .. 3) : (\E b12462 \in (1 :> 2) : FALSE)} : (SubSeq(<<1>>, 7, b12460) = (b12460 :> b12460))} \subseteq (({b12463 : b12463 \in Nat} \cup ({1, 2} \cup {x \in 1..3 : x > 1})) \ (([a |-> 1] - 7) .. (-2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08064 failed.
    TLC encountered a non-enumerable quantifier bound
    <<2>>.
    line 14, col 69 to line 14, col 74 of module random_08064
---*)
