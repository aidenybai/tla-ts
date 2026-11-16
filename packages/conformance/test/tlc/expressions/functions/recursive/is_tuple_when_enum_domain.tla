(*---
description: "toTuple also accepts an enumerated domain of 1..n."
ref: "tlc2/value/impl/FcnLambdaValue.java#toTuple"
flags: [expression]
outcome: success
---*)
---- MODULE is_tuple_when_enum_domain ----
EXTENDS Integers, Sequences
F[n \in {2, 1}] == IF n = 1 THEN 1 ELSE F[n - 1]
Test == Len(F) = 2
====

(*--- recorded
all:
  exit: 0
---*)
