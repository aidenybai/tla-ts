(*---
description: Evaluates a random record expression, seed 262, number 5788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((1..3 \cap {x \in 1..3 : x > 1}) = UNION {SUBSET {1}, {}}) \/ ((3 + 1) = SubSeq(<<>>, 2, 0))) EXCEPT !.a = Len([({2, 1, 3} \ {}) EXCEPT ![1] = (1..3 = 1)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05788 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
