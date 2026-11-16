(*---
description: Evaluates a random seq expression, seed 262, number 8157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SortSeq((<<1>> \o <<>>), LAMBDA p, q : p < q), LAMBDA e : e > 0), (LET b12620 == DOMAIN [x \in 1..2 |-> x] IN ((1 :> 2))[b12620] % ((CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE))[(-1 \div 3)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08157 failed.
    Attempted to check equality of integer 1 with non-integer:
    1..2
---*)
