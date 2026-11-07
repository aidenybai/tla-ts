(*---
description: Evaluates a random record expression, seed 262, number 7618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [b11716 \in {3 : b11717 \in 2} |-> (-2147483647)], b |-> (SubSeq(<<1, 2>>, 2147483647, 2) = (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE))] EXCEPT !.a = @ + (CHOOSE b11718 \in (Tail(<<>>) \cup ({1, 2} \cap 1..3)) : (\A b11719 \in ({x \in 1..3 : x > 1} \cup 1..3) : (b11718 = 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07618 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    2
---*)
