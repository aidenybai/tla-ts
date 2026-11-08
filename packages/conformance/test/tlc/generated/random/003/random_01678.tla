(*---
description: Evaluates a random record expression, seed 262, number 1678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(Append(<<1, 2>>, {1, 2})), b |-> (LET b2673 == <<3, 1, 2>> IN -1 \in ({} \ {1, 2}))] EXCEPT !.a = @ + (CHOOSE b2674 \in (SubSeq(<<1>>, -1, 2) \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) : ((FALSE /\ FALSE) \/ (\E b2675 \in {x \in 1..3 : x > 1} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01678 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
