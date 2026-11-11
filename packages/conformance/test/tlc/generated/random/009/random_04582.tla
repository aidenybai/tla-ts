(*---
description: Evaluates a random int expression, seed 262, number 4582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF [[(3 :> -1) EXCEPT ![([x \in Nat |-> x + 1])[-1]] = (7 \div 3)] EXCEPT !.a = @ + Len(<<3, 3>>)] THEN Head(Append((<<>> \o <<1>>), (SUBSET {1} \cup {1, 2}))) ELSE Len((SubSeq(<<>>, 2, 1) \o [<<1, 2>> EXCEPT ![1] = 2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04582 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 56 to line 14, col 60 of module random_04582>],
    the first argument is:
    -1
    which is not in its domain.
---*)
