(*---
description: Evaluates a random set expression, seed 262, number 3419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([x \in 1..2 |-> x] @@ b5428))[(CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE)] : b5428 \in {IF TRUE THEN 7 ELSE b5429 : b5429 \in UNION {2..1, Nat}}} \cup {Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), Len(SubSeq(<<1, 2>>, 1, 2147483647))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03419 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {}
---*)
