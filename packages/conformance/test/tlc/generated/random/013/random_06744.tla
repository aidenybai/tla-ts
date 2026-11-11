(*---
description: Evaluates a random bool expression, seed 262, number 6744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + 2147483647) * Len(<<3, 1, 2>>)) = IF (<<>> = <<5, 6>>) THEN (7 % 7) ELSE CASE FALSE -> 0 [] OTHER -> 3) <=> ((([a |-> 1] = [a |-> 1]) <=> (-1 \in {x \in 1..3 : x > 1})) => (~({} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06744 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
