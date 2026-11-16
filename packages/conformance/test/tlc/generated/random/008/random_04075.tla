(*---
description: Evaluates a random seq expression, seed 262, number 4075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append((Tail(<<1>>) \o SelectSeq(<<>>, LAMBDA e : e > 0)), (CASE (1 :> 2) -> 3 [] OTHER -> 1 + Head(<<3, 1, 2>>))) EXCEPT ![1] = ((IF FALSE THEN 2147483647 ELSE 0 % Head(<<1, 2>>)) + SortSeq(<<2147483647, 7>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04075 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 83 to line 14, col 88 of module random_04075
---*)
