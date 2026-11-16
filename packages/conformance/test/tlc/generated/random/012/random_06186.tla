(*---
description: Evaluates a random seq expression, seed 262, number 6186.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06186 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(SelectSeq(Append(<<>>, [x \in Nat |-> x + 1]), LAMBDA e : e > 0)) : b9522 \in (({2, 2} \cap UNION {Nat, 1..3}) \cup {(3 * b9523) : b9523 \in (2..1 \ {x \in 1..3 : x > 1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06186 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    Nat
---*)
