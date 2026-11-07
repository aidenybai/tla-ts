(*---
description: Evaluates a random bool expression, seed 262, number 1128.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01128 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b1808 \in {1} : TRUE} \cup (1..3 \ 7)) \cup ((-1 \div <<5, 6>>) .. IF FALSE THEN 1 ELSE 2147483647)) \subseteq Tail(Append(SelectSeq(<<>>, LAMBDA e : e > 0), (0 * 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01128 failed.
    Attempted to check if the value:
    1
    is an element of the integer 7
---*)
