(*---
description: Evaluates a random set expression, seed 262, number 8808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(([(<<1, 2>> \o <<3, 1, 2>>) EXCEPT ![1] = CASE FALSE -> 2 [] OTHER -> 2147483647] \o SubSeq((<<1, 2>> \o <<1, 2>>), (<<5, 6>>)[-1], ([a |-> 1]).a)), Cardinality((([a |-> 1]).a .. Len(<<3, 1, 2>>))), ((CASE TRUE -> 3 [] OTHER -> -1 \in ({1, 2} \ {})))[((3 * 3) \div IF TRUE THEN 2147483647 ELSE 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08808 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
