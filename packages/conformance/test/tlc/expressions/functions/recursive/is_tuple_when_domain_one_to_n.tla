(*---
description: "A recursive function on 1..n is a tuple for Len, through FcnLambdaValue.toTuple."
ref: "tlc2/value/impl/FcnLambdaValue.java#toTuple"
flags: [expression]
outcome: success
---*)
---- MODULE is_tuple_when_domain_one_to_n ----
EXTENDS Integers, Sequences
F[n \in 1..3] == IF n = 1 THEN 1 ELSE F[n - 1] + 1
Test == Len(F) = 3 /\ Head(F) = 1 /\ F \o <<9>> = <<1, 2, 3, 9>>
====

(*--- recorded
all:
  exit: 0
---*)
