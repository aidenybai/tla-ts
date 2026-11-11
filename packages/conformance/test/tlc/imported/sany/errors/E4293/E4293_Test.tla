(*---
description: SANY reports E4293. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4293_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If a recursive operator is declared at one level of a LET/IN block, it must
be defined in that level and not in a nested level.
---- MODULE E4293_Test ----
op ==
  LET
    RECURSIVE recDef
    def ==
      LET recDef == 0
      IN 0
  IN 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 15, col 11 to line 15, col 21 of module E4293_Test
    | Multiple declarations or definitions for symbol recDef.  
    | This duplicates the one at line 13, col 15 to line 13, col 20 of module E4293_Test.
    | Semantic errors:
    | *** Errors: 2
    | line 15, col 11 to line 15, col 21 of module E4293_Test
    | Recursive operator recDef defined at wrong LET/IN level.
    | line 13, col 15 to line 13, col 20 of module E4293_Test
    | Symbol recDef declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
