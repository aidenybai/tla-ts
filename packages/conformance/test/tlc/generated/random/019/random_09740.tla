(*---
description: Evaluates a random record expression, seed 262, number 9740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (DOMAIN (1 :> 2) = (1 .. 7)) \cup {([b15121 \in {1, 2} |-> 7])[(-1 * 1)], LET b15122 == Cardinality(1..3) IN Append(<<>>, 0)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09740 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 17 to line 14, col 51 of module random_09740
---*)
