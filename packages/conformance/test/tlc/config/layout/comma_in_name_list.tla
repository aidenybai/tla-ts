(*---
description: A comma is not a separator but a token that becomes a name in the list, so TLC reports the invariant ',' as undefined.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT A, B
---*)
---- MODULE comma_in_name_list ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == TRUE
B == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2149:3 The invariant A is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2229:1 The invariant , specified in the configuration file
    is not defined in the specification.
---*)
