(*---
description: Evaluates a random int expression, seed 262, number 7364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11327 == (CHOOSE b11328 \in {Append(<<3, 1, 2>>, 7), ([a |-> 1, b |-> TRUE]).a} : (([x \in Nat |-> x + 1])[-1] = [[a |-> 1] EXCEPT !.a = 2])) IN {LET b11330 == IF FALSE THEN 1 ELSE b11327 IN Head(<<1>>) : b11329 \in UNION {(7 .. b11327), UNION {{}, Nat}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07364 failed.
    Attempted to compare integer 1 with non-integer:
    <<3, 1, 2, 7>>
---*)
