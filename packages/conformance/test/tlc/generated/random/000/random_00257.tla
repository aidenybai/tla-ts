(*---
description: Evaluates a random bool expression, seed 262, number 257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{1, 2147483647}, UNION {7, {1, 2}}} = (\A b435 \in {b436 \in {x \in 1..3 : x > 1} : TRUE} : ({2, 1, 3} = SUBSET {1}))) \/ (LET b437 == CASE TRUE -> 7 [] OTHER -> 1 IN (3 * b437) < Head(Append(<<1, 2>>, 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00257 failed.
    Attempted to compare the set {1, 2} with the value:
    7
---*)
