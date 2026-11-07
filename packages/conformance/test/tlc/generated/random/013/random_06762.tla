(*---
description: Evaluates a random bool expression, seed 262, number 6762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b10366 \in {x \in 1..3 : x > 1} : [a |-> 1]) - LET b10367 == 0 IN -1) \div ([[a |-> 1] EXCEPT !.a = 3]).a) \in DOMAIN [(<<5, 6>> @@ <<5, 6>>) EXCEPT ![Head(<<1>>)] = IF FALSE THEN 7 ELSE 7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 69 of module random_06762
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 69 of module random_06762
---*)
