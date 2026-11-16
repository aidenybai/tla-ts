(*---
description: Evaluates a random function expression, seed 262, number 8334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b12891 \in {CASE TRUE -> b12892 [] OTHER -> 2 : b12892 \in ({} \cup {})} |-> ([(1 :> 2) EXCEPT ![b12891] = b12891])[([a |-> 1]).a]] EXCEPT ![(Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) % (-LET b12893 == 1 IN 2147483647))] = (IF ({} = SUBSET {1}) THEN (2147483647 - 7) ELSE (2147483647 \div 3) * (UNION {{1}, {1}} \cap (7 .. 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08334 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2147483647
---*)
