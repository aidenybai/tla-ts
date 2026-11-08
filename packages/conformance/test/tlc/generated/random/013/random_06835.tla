(*---
description: Evaluates a random record expression, seed 262, number 6835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(SubSeq([<<1>> EXCEPT ![1] = 1], ([x \in Nat |-> x + 1])[0], Len(<<1, 2>>))), b |-> [[b10471 \in (SUBSET {1} \cup TRUE) |-> (2147483647 - 7)] EXCEPT ![IF (<<1, 2>> = <<5, 6>>) THEN (-3) ELSE IF FALSE THEN FALSE ELSE 7] = (CHOOSE b10472 \in (1 = 2) : (\E b10473 \in {x \in 1..3 : x > 1} : FALSE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06835 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2
---*)
