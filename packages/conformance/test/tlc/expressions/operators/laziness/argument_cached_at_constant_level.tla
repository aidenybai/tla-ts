(*---
description: "At startup TLC evaluates with TLCState.Empty rather than null for the next state, so a lazy argument is computed once across its uses."
ref: "tlc2/value/impl/LazyValue.java#getValue"
flags: [expression]
outcome: success
---*)
---- MODULE argument_cached_at_constant_level ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
F(a) == a + a
Test == F(P(1, 1)) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
