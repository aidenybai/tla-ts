(*---
description: Evaluates a random bool expression, seed 262, number 2565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({3, 1}).a \div LET b4042 == (-1 = <<5, 6>>) IN Cardinality(2..1)) = ((CHOOSE f \in [{1} -> {0} \cup {1}] : TRUE))[Len(Tail(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02565 failed.
    Attempted to select field "a" from a non-record value {1, 3}
    line 14, col 18 to line 14, col 27 of module random_02565
---*)
