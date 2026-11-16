(*---
description: Evaluates a random int expression, seed 262, number 5888.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05888 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-CASE (UNION {SUBSET {1}, {}} \subseteq DOMAIN Nat) -> ((2 % 2) + (2147483647 + 7)) [] OTHER -> CASE (FALSE <=> FALSE) -> (-1 + 7) [] OTHER -> (2 - 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05888 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a special set constant)
    line 14, col 57 to line 14, col 66 of module random_05888
---*)
