(*---
description: Evaluates a random record expression, seed 262, number 2631.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02631 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b4146 \in {x \in 1..3 : x > 1} : TRUE), b |-> ([a |-> 1, b |-> TRUE] = <<1, 2>>)] EXCEPT !.a = ((~FALSE) % IF TRUE THEN 2147483647 ELSE 7)] EXCEPT !.a = @ + LET b4147 == (CHOOSE b4148 \in UNION {1..3, {2, 1, 3}} : (FALSE <=> FALSE)) IN LET b4149 == ((1 :> 2))[b4147] IN Len(<<1, 2>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02631 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    <<1, 2>>
---*)
