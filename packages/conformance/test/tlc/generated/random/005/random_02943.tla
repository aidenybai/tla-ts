(*---
description: Evaluates a random function expression, seed 262, number 2943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Head(SortSeq(<<>>, LAMBDA p, q : p < q)) :> CASE ({x \in 1..3 : x > 1} \subseteq {1, 2}) -> IF FALSE THEN 7 ELSE 2147483647 [] OTHER -> (1 % 7)) EXCEPT ![(((<<3, 1, 2>> \ {2, 1, 3}) \subseteq {b4662 \in 1..3 : FALSE}) + (CHOOSE b4663 \in ({} \ {x \in 1..3 : x > 1}) : (~FALSE)))] = ([[<<5, 6>> EXCEPT ![7] = 2] EXCEPT ![[[a |-> 1] EXCEPT !.a = @ + 2147483647]] = CASE FALSE -> -1 [] OTHER -> 7] @@ ((-1) :> IF TRUE THEN 3 ELSE 3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
