(*---
description: Evaluates a random int expression, seed 262, number 4070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [b6406 \in {2, 1, 3} |-> b6406] \ ((Nat \ {x \in 1..3 : x > 1}) \cap SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) \cap ((({1} \cup {1}) \ {2 : b6407 \in 2..1}) \cap UNION {(1 .. -1), UNION {{1}, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04070 failed.
    Attempted to check set membership in a tuple value.
---*)
