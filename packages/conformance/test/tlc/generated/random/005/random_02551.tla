(*---
description: Evaluates a random seq expression, seed 262, number 2551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<(-((1 :> 2))[7]), (Len(<<>>) * (7 * 7))>>, Cardinality((({x \in 1..3 : x > 1} \cup 1..3) \cap {7, 2}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02551 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
