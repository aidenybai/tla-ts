(*---
description: SANY reports E4241. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4241_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
It is an error to provide multiple substitutions for the same symbol when
importing a module using INSTANCE.
---- MODULE E4241_Test ----
---- MODULE Inner ----
CONSTANT c
====
INSTANCE Inner WITH c <- 0, c <- 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 34 to line 14, col 34 of module E4241_Test
    | Multiple substitutions for symbol 'c' in substitution.
    3002:1 Parsing or semantic analysis failed.
---*)
