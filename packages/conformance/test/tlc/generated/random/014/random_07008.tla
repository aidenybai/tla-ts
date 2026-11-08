(*---
description: Evaluates a random record expression, seed 262, number 7008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 \div 0) :> (2147483647 + 2)) @@ [(CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) EXCEPT ![CASE FALSE -> 7 [] OTHER -> 2147483647] = (1 % 7)]))[((Len(<<1>>) \div [[a |-> 1] EXCEPT !.a = 2147483647]) * Head(Append(<<3, 1, 2>>, <<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07008 failed.
    2179:0 The second argument of \div is 0.
---*)
