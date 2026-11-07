(*---
description: Evaluates a random set expression, seed 262, number 7269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cap ({2, 1, 3} \cup Nat)) \ ({b11196 \in {x \in 1..3 : x > 1} : TRUE} \ ({} \cap {1, 2}))) \ UNION {(Append(<<1>>, 7) = (CHOOSE f \in [2..1 -> {}] : TRUE)), UNION {{3, 2147483647}, {b11197 : b11197 \in SUBSET {1}}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07269 failed.
    Attempted to check equality of integer 3 with non-integer:
    {}
---*)
