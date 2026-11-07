(*---
description: Evaluates a random bool expression, seed 262, number 9673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b15011 \in ((SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) \o SubSeq(<<>>, 3, 2)) \cap ({b15012 : b15012 \in 1..3} \ UNION {{}, 1..3})) : ((DOMAIN [x \in Nat |-> x + 1] = ({} \cap 2..1)) \/ {b15013 \in {1 : b15014 \in SUBSET {1}} : (\A b15015 \in {2, 1, 3} : FALSE)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
