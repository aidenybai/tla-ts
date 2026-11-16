(*---
description: "A name twice in one VARIABLE statement only warns, since the kind and arity match."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
config: |
  INIT Init
  NEXT Next
outcome: success
---*)
---- MODULE variable_twice_in_one_statement ----
VARIABLE v, v
Init == v = 0
Next == v' = v
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 11, col 13 to line 11, col 13 of module variable_twice_in_one_statement
    | Multiple declarations or definitions for symbol v.  
    | This duplicates the one at line 11, col 10 to line 11, col 10 of module variable_twice_in_one_statement.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
