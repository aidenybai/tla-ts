(*---
description: Evaluates a random set expression, seed 262, number 5943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (FALSE <=> TRUE) THEN ((1 :> 2))[-1] ELSE (-1 * 2147483647), CASE (0 < 7) -> ((1 :> 2))[7] [] OTHER -> IF FALSE THEN 2147483647 ELSE 7} \cup Head(<<SortSeq(<<1>>, LAMBDA p, q : p < q), (1 + 2147483647)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05943 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
