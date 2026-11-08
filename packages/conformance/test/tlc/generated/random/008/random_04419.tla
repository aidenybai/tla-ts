(*---
description: Evaluates a random record expression, seed 262, number 4419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(SubSeq(SubSeq(<<>>, 2, -1), LET b6953 == 2147483647 IN b6953, LET b6954 == 1 IN 3)), b |-> ((UNION {FALSE, 2..1} \subseteq ({} \cup 2..1)) => ((<<1>> \o <<3, 1, 2>>) = (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04419 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
