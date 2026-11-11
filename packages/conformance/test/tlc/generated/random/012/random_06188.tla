(*---
description: Evaluates a random record expression, seed 262, number 6188.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06188 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE b9524 \in {b9525 \in {2, 1, 3} : TRUE} : (b9524 \in 1..3)) % CASE (2 \in <<1, 2>>) -> (<<5, 6>> = 2147483647) [] OTHER -> IF FALSE THEN 2 ELSE -1), b |-> (((7 .. 7) \ (2 .. 2147483647)) = UNION {UNION {SUBSET {1}, 1..3}, (<<>> .. 1)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06188 failed.
    Attempted to check set membership in a tuple value.
---*)
