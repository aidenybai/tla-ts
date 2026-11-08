(*---
description: Evaluates a random seq expression, seed 262, number 5389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<(-Len(<<3, 1, 2>>)), Cardinality(DOMAIN <<1, 2>>)>>, CASE ((FALSE \/ TRUE) /\ (<<1>> = (1 :> 2))) -> CASE (FALSE /\ FALSE) -> (-2) [] OTHER -> IF TRUE THEN 0 ELSE -1 [] OTHER -> Tail([<<3, 1, 2>> EXCEPT ![1] = 0]), <<(([a |-> 1]).a \div (7 + 7)), [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05389 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
