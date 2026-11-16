(*---
description: Evaluates a random int expression, seed 262, number 8606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (UNION {([a |-> 1, b |-> TRUE] \cup {}), (2 .. 2147483647)} \subseteq (UNION {<<5, 6>>, {1, 2}} \cap {0, 7})) -> Len(SelectSeq(SubSeq(<<>>, 7, 0), LAMBDA e : e > 0)) [] OTHER -> IF (([a |-> 1, b |-> TRUE]).a = (-1 % 3)) THEN CASE (2147483647 \in {}) -> (3 \div 2) [] OTHER -> ([x \in Nat |-> x + 1])[2147483647] ELSE ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08606 failed.
    Attempted to compare the set {1, 2} with the value:
    <<5, 6>>
---*)
