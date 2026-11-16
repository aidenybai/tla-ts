(*---
description: Evaluates a random seq expression, seed 262, number 9126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([(Append(<<>>, 7) \o (<<>> \o <<1>>)) EXCEPT ![1] = CASE (1..3 \subseteq {1}) -> Cardinality(SUBSET {1}) [] OTHER -> (-7)], IF ({2147483647, 3} = (CHOOSE r \in [a : 1..2] : TRUE)) THEN (({x \in 1..3 : x > 1} - 3) % (CHOOSE b14176 \in Nat : TRUE)) ELSE ((<<>>)[-1] * IF [x \in Nat |-> x + 1] THEN -1 ELSE 1), (((2 \div 2) \div (2147483647 * 0)) - Head([<<3, 1, 2>> EXCEPT ![1] = 2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09126 failed.
    Attempted to check equality of the set {3, 2147483647} with the value:
    [a |-> 1]
---*)
