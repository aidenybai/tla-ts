(*---
description: Evaluates a random set expression, seed 262, number 5815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Len(Append(<<1>>, b8961)) \div CASE (<<3, 1, 2>> = <<5, 6>>) -> (FALSE .. b8961) [] OTHER -> IF FALSE THEN -1 ELSE b8961) : b8961 \in ({(0 - 2), (2 % 2147483647)} \cap ([<<3, 1, 2>> EXCEPT ![1] = 1] \o (<<1>> \o <<1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05815 failed.
    Attempted to check set membership in a tuple value.
---*)
