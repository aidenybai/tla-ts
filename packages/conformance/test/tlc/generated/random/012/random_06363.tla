(*---
description: Evaluates a random int expression, seed 262, number 6363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![CASE Append(<<1>>, -1) -> (CHOOSE b9783 \in {2, 1, 3} : FALSE) [] OTHER -> Head(<<1>>)] = LET b9784 == Head(<<>>) IN ((1 :> 2))[b9784]])[Head(Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06363 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 88 to line 14, col 104 of module random_06363
---*)
