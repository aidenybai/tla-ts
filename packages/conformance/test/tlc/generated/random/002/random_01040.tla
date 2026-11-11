(*---
description: Evaluates a random set expression, seed 262, number 1040.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01040 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((2147483647 + 1) = (-0)) THEN LET b1668 == SubSeq(<<1, 2>>, 3, 3) IN (-3) ELSE [[a |-> (1 :> 2), b |-> TRUE] EXCEPT !.a = (CHOOSE b1669 \in Nat : TRUE)], ([<<3, 2147483647>> EXCEPT ![1] = SubSeq(<<1>>, FALSE, TRUE)] = (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01040 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
