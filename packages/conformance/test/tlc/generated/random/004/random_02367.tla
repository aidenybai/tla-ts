(*---
description: Evaluates a random function expression, seed 262, number 2367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3747 \in {Len(Append(2, 1)), CASE (SUBSET {1} = {1, 2}) -> (1 % 1) [] OTHER -> (3 + 0)} |-> LET b3748 == LET b3749 == (b3747 + b3747) IN Head(<<1, 2>>) IN Len([<<1, 2>> EXCEPT ![1] = b3748])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02367 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2
---*)
