(*---
description: Evaluates a random seq expression, seed 262, number 7785.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07785 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SubSeq(Tail(<<1>>), Head(<<>>), (CHOOSE b12013 \in {x \in 1..3 : x > 1} : TRUE)) \o Append(Tail(<<1, 2>>), (1 :> -1))), (([2..1 EXCEPT !.a = 7]).a % CASE (FALSE \/ TRUE) -> DOMAIN <<5, 6>> [] OTHER -> (2147483647 - 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07785 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
