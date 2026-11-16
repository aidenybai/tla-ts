(*---
description: Evaluates a random bool expression, seed 262, number 1942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(Append(<<1, 2>>, 7), IF FALSE THEN 0 ELSE 2, ((1 :> 2))[2]) \o Tail(Append(<<1>>, 1))) = [((<<1>> \o <<1, 2>>) @@ [b3059 \in {1, 2} |-> 3]) EXCEPT ![(IF TRUE THEN -1 ELSE 1 - (2147483647 % 2147483647))] = Head(<<2, 7>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01942 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
