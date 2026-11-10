(*---
description: Evaluates a random record expression, seed 262, number 9554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (FALSE <=> FALSE) -> CASE FALSE -> -1 [] OTHER -> 1 [] OTHER -> IF <<>> THEN 1 ELSE 2, b |-> ((3 .. 3) \subseteq LET b14840 == -1 IN 0)] EXCEPT !.a = Len(Append(SelectSeq(<<1>>, LAMBDA e : e > 0), ({2, 1, 3} = {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09554 failed.
    Attempted to check if the value:
    3
    is an element of the integer 0
---*)
