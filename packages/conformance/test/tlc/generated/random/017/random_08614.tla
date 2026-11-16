(*---
description: Evaluates a random bool expression, seed 262, number 8614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({1 : b13342 \in {2, 1, 3}} = (1 .. -1)) /\ (\A b13343 \in ({1} \cup {2, 1, 3}) : (b13343 = b13343))) /\ (SubSeq(SubSeq(<<>>, 2, [a |-> 1]), (<<>> % 0), Len(<<1>>)) = [Append(<<1>>, 0) EXCEPT ![LET b13344 == -1 IN b13344] = ([a |-> 1, b |-> TRUE] /\ FALSE)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
