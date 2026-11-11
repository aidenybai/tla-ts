(*---
description: SANY reports E4223. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4223_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
If two distinct modules with the same name are imported into the same module,
this is an error.
---- MODULE E4223_Test ----
EXTENDS Naturals
---- MODULE Naturals ----
====
INSTANCE Naturals
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 13, col 4 of module E4223_Test
    | Multiply-defined module 'Naturals': this definition or declaration conflicts 
    | with the one at line 1, col 1 to line 36, col 77 of module Naturals.
    3002:1 Parsing or semantic analysis failed.
---*)
