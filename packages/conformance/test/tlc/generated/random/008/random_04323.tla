(*---
description: Evaluates a random bool expression, seed 262, number 4323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = Len(<<1>>)] EXCEPT ![1] = (Append(<<1, 2>>, 7))[LET b6814 == -1 IN b6814]] = (\A b6815 \in UNION {({x \in 1..3 : x > 1} \cup 2..1), DOMAIN [x \in 1..2 |-> x]} : ((\A b6816 \in Nat : FALSE) /\ ({x \in 1..3 : x > 1} = SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04323 failed.
    Attempted to access index -1 of tuple
    <<1, 2, 7>>
    which is out of bounds.
---*)
