(*---
description: SANY reports W4801. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/W4801_Test.tla
features:
  - sany-errors
outcome: success
---*)
If a symbol is defined then a module is imported using INSTANCE and that
module contains a conflicting symbol, generate a warning since the symbol in
the imported module is ignored in favor of the original definition.
---- MODULE W4801_Test ----
Nat == TRUE
INSTANCE Naturals
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | *** Warnings: 1
    | line 14, col 1 to line 14, col 16 of module Naturals
    | Multiple declarations or definitions for symbol Nat.  
    | This duplicates the one at line 12, col 1 to line 12, col 11 of module W4801_Test.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
