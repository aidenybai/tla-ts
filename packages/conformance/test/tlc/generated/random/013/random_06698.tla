(*---
description: Evaluates a random set expression, seed 262, number 6698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SelectSeq(<<>>, LAMBDA e : e > 0)) .. LET b10265 == (CHOOSE r \in [a : {0} \cup {1}] : TRUE) IN Len(<<1, 2>>)) \cup UNION {{b10266 \in {2, 2} : (b10266 < b10266)}, {{b10267 \in 2..1 : TRUE}, LET b10268 == 2 IN b10268}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06698 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
