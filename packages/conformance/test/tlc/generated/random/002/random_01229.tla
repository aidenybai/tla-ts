(*---
description: Evaluates a random set expression, seed 262, number 1229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE)).a .. (SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) @@ (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) @@ [<<5, 6>> EXCEPT ![1] = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01229 failed.
    Attempted to check equality of integer 0 with non-integer:
    "a"
---*)
