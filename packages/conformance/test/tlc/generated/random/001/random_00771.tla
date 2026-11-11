(*---
description: Evaluates a random bool expression, seed 262, number 771.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00771 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (DOMAIN <<5, 6>> = DOMAIN SUBSET {1}) THEN DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]) ELSE Len(<<1, FALSE>>) = ((LET b1261 == 0 IN 3 .. (2 % -1)) = ((-0) .. (-1 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00771 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a set of the form SUBSET S)
    line 14, col 39 to line 14, col 55 of module random_00771
---*)
