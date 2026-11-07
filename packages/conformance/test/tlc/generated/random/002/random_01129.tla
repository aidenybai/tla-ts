(*---
description: Evaluates a random int expression, seed 262, number 1129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([Append(<<1, 2>>, 2147483647) EXCEPT ![1] = Len(<<1>>)] = ((-1 :> 2) @@ (3 = 2147483647))) -> (CHOOSE b1809 \in ({b1810 \in 2..1 : FALSE} \cap ({1, 2} \ SUBSET {1})) : (\E b1811 \in (2147483647 .. b1809) : (b1809 = FALSE))) [] OTHER -> ((CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE))[Head([<<1>> EXCEPT ![1] = 0])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The second argument of @@ should be a function, but instead it is:
    FALSE
---*)
