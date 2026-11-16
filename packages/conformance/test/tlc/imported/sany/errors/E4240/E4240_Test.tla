(*---
description: SANY reports E4240. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4240_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
When a module is imported with INSTANCE, all its constants and variables must
be assigned either implicitly or explicitly.
---- MODULE E4240_Test ----
---- MODULE Inner ----
CONSTANT c
====
INSTANCE Inner
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 14, col 1 to line 14, col 14 of module E4240_Test
    | Substitution missing for symbol c declared at line 12, col 10 to line 12, col 10 of module E4240_Test 
    | and instantiated in module E4240_Test.
    3002:1 Parsing or semantic analysis failed.
---*)
