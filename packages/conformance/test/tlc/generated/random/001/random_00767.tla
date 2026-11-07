(*---
description: Evaluates a random int expression, seed 262, number 767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~(TRUE <=> FALSE)) => ((SUBSET {1} \cap 1..3) \subseteq UNION {{}, {1}})) -> (-(Head(<<1, 2>>) * (3 * 0))) [] OTHER -> ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE))[Head(SelectSeq(<<1>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00767 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
