(*---
description: Evaluates a random seq expression, seed 262, number 892.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00892 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(Tail(SubSeq(<<3, 1, 2>>, 3, 0)), ((2147483647 * 1) * ([a |-> 1]).a)), IF (CASE TRUE -> 0 [] OTHER -> -1 = (-2)) THEN ((CHOOSE r \in [a : {1}] : TRUE)).a ELSE LET b1439 == Head(<<1>>) IN (b1439 - b1439)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00892 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
