(*---
description: "A name twice in one CONSTANT statement only warns, since the kind and arity match."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
config: |
  CONSTANT c = 1
outcome: success
---*)
---- MODULE constant_twice_in_one_statement ----
CONSTANT c, c
ASSUME c = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 10, col 13 to line 10, col 13 of module constant_twice_in_one_statement
    | Multiple declarations or definitions for symbol c.  
    | This duplicates the one at line 10, col 10 to line 10, col 10 of module constant_twice_in_one_statement.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
