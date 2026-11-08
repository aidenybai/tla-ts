(*---
description: Evaluates a random bool expression, seed 262, number 6121.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06121 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SubSeq(SubSeq(<<1>>, 2147483647, 2147483647), (2147483647 % 7), LET b9421 == 2147483647 IN {}), IF (TRUE /\ FALSE) THEN CASE TRUE -> 7 [] OTHER -> 7 ELSE Head(<<1, 2>>), (CHOOSE b9422 \in ({} \ 1..3) : (~FALSE))) = (([[a |-> 1, b |-> TRUE] EXCEPT ![2] = 2147483647] :> IF TRUE THEN 3 ELSE 7) @@ [(3 :> 3) EXCEPT ![(CHOOSE b9423 \in Nat : TRUE)] = (-1 - 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06121 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    2147483647
---*)
