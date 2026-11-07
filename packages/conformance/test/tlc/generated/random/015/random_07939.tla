(*---
description: Evaluates a random int expression, seed 262, number 7939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (((2 + 1) .. (CHOOSE b12254 \in SUBSET {1} : FALSE)) \subseteq ({2147483647, 0} \cup {1, 0})) THEN Len(((<<1, 2>> \o <<1, 2>>) \o SubSeq(<<>>, 3, -1))) ELSE [[a |-> (-0), b |-> (FALSE /\ FALSE)] EXCEPT !.a = ((3 + 3) * [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07939 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 68 of module random_07939
---*)
