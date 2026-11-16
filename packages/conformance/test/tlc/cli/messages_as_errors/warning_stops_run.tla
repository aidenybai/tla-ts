(*---
description: A warning code in the list is raised as an error by printWarning.
ref: tlc2/output/MP.java#printWarning
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
  INVARIANT K
args:
  - -messagesAsErrors
  - "2149"
---*)
---- MODULE warning_stops_run ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
K == TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: 2149:1 The invariant K is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
---*)
