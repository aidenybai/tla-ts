(*---
description: Evaluates a random seq expression, seed 262, number 6543.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06543 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10059 == IF (~(<<>> = (1 :> 2))) THEN CASE (1 < -1) -> Head(<<1, 2>>) [] OTHER -> Head(<<3, 1, 2>>) ELSE IF (<<>> = [x \in Nat |-> x + 1]) THEN CASE FALSE -> 0 [] OTHER -> -1 ELSE ([a |-> 1]).a IN Head(Tail(SubSeq(<<3, 1, 2>>, b10059, 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06543 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
