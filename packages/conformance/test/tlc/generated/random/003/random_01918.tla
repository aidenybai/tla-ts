(*---
description: Evaluates a random record expression, seed 262, number 1918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Len(<<3, 1, 2>>) + (<<5, 6>>)[7]), b |-> (Head(<<3, 1, 2>>) < (3 - 7))] EXCEPT !.a = @ + IF (\E b3012 \in ({x \in 1..3 : x > 1} \cap 1..3) : ({} \subseteq {1})) THEN ((2 - 1) \div (Nat % 2)) ELSE SubSeq([<<3, 1, 2>> EXCEPT ![1] = 1], CASE FALSE -> -1 [] OTHER -> 2147483647, Len(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01918 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
