(*---
description: Evaluates a random function expression, seed 262, number 502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b832 \in ((LET b833 == 0 IN 0 .. (2147483647 * 2)) \cup ({7 : b834 \in 2..1} \ (\A b835 \in SUBSET {1} : FALSE))) |-> CASE (Append(<<>>, b832) = (b832 :> b832)) -> [([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) EXCEPT !.a = Head(<<1>>)] [] OTHER -> (CHOOSE b836 \in ({2, 1, 3} \ {2, 1, 3}) : (2..1 \subseteq Nat))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2
    2178:0 Overflow when computing 2147483647*2
---*)
