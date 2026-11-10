(*---
description: Evaluates a random seq expression, seed 262, number 9403.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09403 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(<<CASE FALSE -> 2 [] OTHER -> 2, (-1)>>, ((1 + 2147483647) \in {b14587 : b14587 \in 2..1}), CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (3 \div 2147483647) [] OTHER -> Cardinality({})) EXCEPT ![1] = ((CHOOSE f \in [{1} -> {2, 1, 3}] : TRUE))[(LET b14588 == 7 IN 0 % Head(<<>>))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09403 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
